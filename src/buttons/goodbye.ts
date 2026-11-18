import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { modalForm, pickedChannelId } from "@lib/discord";
import { recordsSettings } from "@lib/settings";
import { applyGoodbye, farewellFor, GOODBYE_PANEL_ID, goodbyePanel, readGoodbye } from "@lib/welcome";
import { GOODBYE_STYLES, type GoodbyeStyle, sanitiseText, WELCOME_LIMITS } from "@testify/shared";

const isStyle = (value: string | undefined): value is GoodbyeStyle =>
	(GOODBYE_STYLES as readonly string[]).includes(value ?? "");

export default recordsSettings(
	["goodbye.update"],
	defineButton({
		id: GOODBYE_PANEL_ID,
		ownerOnly: true,

		async run(interaction, context) {
			const guild = interaction.guild;
			if (guild === null) return;

			if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) !== true) {
				throw new UserFacingError(
					botCopy(
						"You need the Manage Server permission to change the goodbye message.",
						"تحتاج إلى صلاحية «إدارة الخادم» لتعديل رسالة الوداع.",
					),
				);
			}

			const ownerId = interaction.user.id;
			const current = await readGoodbye(guild);

			if (interaction.isButton() && context.action === "edit") {
				await interaction.showModal(
					modalForm({
						id: GOODBYE_PANEL_ID,
						action: "save-message",
						args: [ownerId],
						title: botCopy("Goodbye message", "رسالة الوداع"),
						fields: [
							{
								id: "message",
								label: botCopy("The message", "نص الرسالة"),
								value: current.message,
								paragraph: true,
								maxLength: WELCOME_LIMITS.maxMessage,
							},
						],
					}),
				);
				return;
			}

			if (interaction.isButton() && context.action === "preview") {
				const member = await guild.members.fetch(interaction.user.id).catch(() => null);
				if (member === null)
					throw new UserFacingError(botCopy("I could not read your member profile.", "تعذّرت قراءة بيانات عضويتك."));

				await interaction.reply({ ...farewellFor(member, current), flags: MessageFlags.Ephemeral });
				return;
			}

			let settings;
			let note: string;

			if (interaction.isModalSubmit() && context.action === "save-message") {
				const message = sanitiseText(interaction.fields.getTextInputValue("message"));
				if (message === "")
					throw new UserFacingError(botCopy("Write something for the goodbye to say.", "اكتب نص رسالة الوداع."));
				settings = await applyGoodbye(guild, { message }, ownerId);
				note = "The goodbye message is saved.";
			} else if (interaction.isChannelSelectMenu() && context.action === "channel") {
				const channelId = await pickedChannelId(interaction, guild);
				if (channelId === null) return;
				settings = await applyGoodbye(guild, { channelId }, ownerId);
				note = botCopy(`Goodbyes will be posted in <#${channelId}>.`, `ستُرسل رسائل الوداع في <#${channelId}>.`);
			} else if (interaction.isButton() && context.action === "style") {
				const style = context.args[0];
				if (!isStyle(style)) return;
				settings = await applyGoodbye(guild, { style }, ownerId);
				note = style === "embed" ? "The goodbye is sent as an embed." : "The goodbye is sent as a plain message.";
			} else if (interaction.isButton() && context.action === "toggle") {
				settings = await applyGoodbye(guild, { enabled: !current.enabled }, ownerId);
				note = settings.enabled
					? botCopy("Goodbye messages are on.", "فُعّلت رسائل الوداع.")
					: botCopy("Goodbye messages are off.", "عُطّلت رسائل الوداع.");
			} else {
				return;
			}

			const panel = goodbyePanel(settings, ownerId, note);
			if (interaction.isModalSubmit() && !interaction.isFromMessage()) return;
			await interaction.update(panel);
		},
	}),
);
