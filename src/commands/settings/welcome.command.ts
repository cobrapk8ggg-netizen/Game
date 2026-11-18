import { PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineCommand, inGuild } from "@core/command";
import { UserFacingError } from "@core/errors";
import { getWelcome, saveWelcome } from "@database/repositories/welcomeRepository";
import { reply, successEmbed } from "@lib/discord";
import { recordsSettings } from "@lib/settings";
import { checkBackground, goodbyePanel, greetingFor, normaliseWelcome, readGoodbye, welcomePanel } from "@lib/welcome";

export default recordsSettings(
	["welcome.update"],
	defineCommand({
		name: "welcome",
		description: "Greets new members when they join, and says goodbye when they leave.",
		category: "settings",
		private: true,
		aliases: ["welcome-system", "greet"],
		guildOnly: true,
		permissions: [PermissionFlagsBits.ManageGuild],
		botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
		subcommands: [
			{
				name: "setup",
				description: "Open the welcome panel.",
				async run(interaction) {
					const guild = inGuild(interaction);
					const config = normaliseWelcome(await getWelcome(guild.id));

					await reply(interaction, welcomePanel({ config }, interaction.user.id));
				},
			},
			{
				name: "background",
				description: "Upload a background image for the welcome card.",
				options: [
					{
						name: "image",
						description: "A PNG or JPG, ideally 1024x400.",
						type: "attachment",
						required: true,
					},
				],
				async run(interaction) {
					const guild = inGuild(interaction);
					const config = normaliseWelcome(await getWelcome(guild.id));
					if (config === null)
						throw new UserFacingError(
							botCopy(
								"Set the welcome system up first with `/welcome setup`.",
								"اضبط نظام الترحيب أولًا باستخدام `/welcome setup`.",
							),
						);

					const file = interaction.options.getAttachment("image", true);

					// Checked before downloading, so a huge upload never reaches memory.
					const verdict = checkBackground(file);
					if (!verdict.ok)
						throw new UserFacingError(verdict.reason ?? botCopy("That image cannot be used.", "تعذّر استخدام الصورة."));

					await interaction.deferReply();

					const response = await fetch(file.url).catch(() => null);
					if (!response?.ok)
						throw new UserFacingError(
							botCopy(
								"I could not download that image. Try uploading it again.",
								"تعذّر تنزيل الصورة. أعد رفعها وحاول مجددًا.",
							),
						);

					// Stored as bytes, because Discord's signed attachment URLs expire within hours.
					await saveWelcome(guild.id, {
						background: {
							data: Buffer.from(await response.arrayBuffer()),
							contentType: file.contentType ?? "image/png",
							name: file.name,
						},
						style: "card",
					});

					await reply(interaction, {
						embeds: [
							successEmbed(
								botCopy(
									"Background saved, and the greeting is now an image card. Try `/welcome test`.",
									"حُفظت الخلفية وأصبح الترحيب بطاقة مصوّرة. عاينها باستخدام `/welcome test`.",
								),
							),
						],
					});
				},
			},
			{
				name: "goodbye",
				description: "Open the goodbye panel, for a message when somebody leaves.",
				aliases: ["goodbye"],
				async run(interaction) {
					const guild = inGuild(interaction);

					await reply(interaction, goodbyePanel(await readGoodbye(guild), interaction.user.id));
				},
			},
			{
				name: "test",
				description: "Send yourself the greeting a new member would get.",
				async run(interaction) {
					const guild = inGuild(interaction);
					const settings = await getWelcome(guild.id);
					const config = normaliseWelcome(settings);
					if (config === null)
						throw new UserFacingError(
							botCopy(
								"The welcome system is not set up. Try `/welcome setup`.",
								"لم يُضبط نظام الترحيب. استخدم `/welcome setup`.",
							),
						);

					await interaction.deferReply();

					const member = await guild.members.fetch(interaction.user.id).catch(() => null);
					if (member === null)
						throw new UserFacingError(botCopy("I could not read your member profile.", "تعذّرت قراءة بيانات عضويتك."));

					await reply(interaction, await greetingFor(member, config, settings));
				},
			},
		],

		async run(interaction) {
			const guild = inGuild(interaction);
			const config = normaliseWelcome(await getWelcome(guild.id));

			await reply(interaction, welcomePanel({ config }, interaction.user.id));
		},
	}),
);
