import { PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import {
	applyBirthdaySettings,
	birthdayMessage,
	BIRTHDAY_PANEL_ID,
	birthdaySettingsPanel,
	readBirthdayOverview,
} from "@lib/birthdays";
import { modalForm, pickedChannelId } from "@lib/discord";
import { recordsSettings } from "@lib/settings";
import { BIRTHDAY_LIMITS, sanitiseText } from "@testify/shared";

export default recordsSettings(
	["birthdays.update"],
	defineButton({
		id: BIRTHDAY_PANEL_ID,
		ownerOnly: true,

		async run(interaction, context) {
			const guild = interaction.guild;
			if (guild === null) return;

			if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) !== true) {
				throw new UserFacingError(
					botCopy(
						"You need the Manage Server permission to change birthday posts.",
						"تحتاج إلى صلاحية إدارة الخادم لتعديل منشورات أعياد الميلاد.",
					),
				);
			}

			const ownerId = interaction.user.id;
			const current = await readBirthdayOverview(guild);

			if (interaction.isButton() && context.action === "edit") {
				await interaction.showModal(
					modalForm({
						id: BIRTHDAY_PANEL_ID,
						action: "save-message",
						args: [ownerId],
						title: botCopy("Birthday message", "رسالة التهنئة بعيد الميلاد"),
						fields: [
							{
								id: "message",
								label: botCopy("The message", "نص التهنئة"),
								value: birthdayMessage(current.message),
								paragraph: true,
								maxLength: BIRTHDAY_LIMITS.maxMessage,
							},
						],
					}),
				);
				return;
			}

			let note: string;
			if (interaction.isModalSubmit() && context.action === "save-message") {
				const message = sanitiseText(interaction.fields.getTextInputValue("message"));
				if (message === "")
					throw new UserFacingError(
						botCopy("Write something for the birthday post to say.", "اكتب نص منشور التهنئة بعيد الميلاد."),
					);
				await applyBirthdaySettings(guild, { message }, ownerId);
				note = botCopy("The birthday message is saved.", "حُفظت رسالة التهنئة.");
			} else if (interaction.isChannelSelectMenu() && context.action === "channel") {
				const channelId = await pickedChannelId(interaction, guild);
				if (channelId === null) return;
				await applyBirthdaySettings(guild, { channelId }, ownerId);
				note = botCopy(
					`Birthdays will be posted in <#${channelId}>.`,
					`ستُنشر التهاني بأعياد الميلاد في <#${channelId}>.`,
				);
			} else if (interaction.isButton() && context.action === "toggle") {
				const saved = await applyBirthdaySettings(guild, { enabled: !current.enabled }, ownerId);
				note = saved.enabled
					? botCopy("Birthday posts are on.", "فُعّلت منشورات التهنئة.")
					: botCopy("Birthday posts are off.", "عُطّلت منشورات التهنئة.");
			} else {
				return;
			}

			if (interaction.isModalSubmit() && !interaction.isFromMessage()) return;
			const overview = await readBirthdayOverview(guild);
			await interaction.update(birthdaySettingsPanel(overview, overview.shared, ownerId, note));
		},
	}),
);
