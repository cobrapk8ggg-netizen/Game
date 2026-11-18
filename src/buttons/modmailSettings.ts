import { PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { pickedChannelId } from "@lib/discord";
import { applyModmailSettings, MODMAIL_SETTINGS_ID, modmailSettingsPanel, readModmailSettings } from "@lib/modmail";

export default defineButton({
	id: MODMAIL_SETTINGS_ID,
	ownerOnly: true,

	async run(interaction, context) {
		const guild = interaction.guild;
		if (guild === null || !interaction.isMessageComponent()) return;

		if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) !== true) {
			throw new UserFacingError(
				botCopy(
					"You need the Manage Server permission to change mod mail.",
					"تحتاج إلى صلاحية إدارة الخادم لتعديل إعدادات مراسلات الإشراف.",
				),
			);
		}

		const ownerId = interaction.user.id;

		if (context.action === "channel") {
			const channelId = await pickedChannelId(interaction, guild);
			if (channelId === null) return;

			const settings = await applyModmailSettings(guild, { channelId }, ownerId);
			await interaction.update(
				modmailSettingsPanel(
					settings,
					ownerId,
					botCopy(`Threads will be made in <#${channelId}>.`, `ستُنشأ المحادثات الفرعية في <#${channelId}>.`),
				),
			);
			return;
		}

		if (context.action === "ping" && interaction.isRoleSelectMenu()) {
			const pingRoleId = interaction.values[0] ?? null;
			const settings = await applyModmailSettings(guild, { pingRoleId }, ownerId);
			const note =
				pingRoleId === null
					? botCopy("Nobody is pinged when one opens.", "تُفتح المحادثات من دون إشعار أيّ رتبة.")
					: botCopy(
							`<@&${pingRoleId}> is pinged when one opens.`,
							`تتلقّى الرتبة <@&${pingRoleId}> إشعارًا عند فتح محادثة.`,
						);
			await interaction.update(modmailSettingsPanel(settings, ownerId, note));
			return;
		}

		if (context.action === "signed" && interaction.isStringSelectMenu()) {
			const anonymous = interaction.values[0] === "anonymous";
			const settings = await applyModmailSettings(guild, { anonymous }, ownerId);
			const note = anonymous
				? botCopy("Replies are signed as the server's staff.", "تُوقّع الردود باسم فريق الإشراف.")
				: botCopy("Replies are signed with each name.", "يُوقّع كلّ ردّ باسم المشرف الذي كتبه.");
			await interaction.update(modmailSettingsPanel(settings, ownerId, note));
			return;
		}

		if (context.action === "toggle") {
			const current = await readModmailSettings(guild);
			const settings = await applyModmailSettings(guild, { enabled: !current.enabled }, ownerId);
			await interaction.update(
				modmailSettingsPanel(
					settings,
					ownerId,
					settings.enabled
						? botCopy("Mod mail is on.", "فُعّلت مراسلات الإشراف.")
						: botCopy("Mod mail is off.", "عُطّلت مراسلات الإشراف."),
				),
			);
		}
	},
});
