import { PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { deleteVerifyConfig, getVerifyConfig, saveVerifyConfig } from "@database/repositories/verificationRepository";
import { modalForm, pickedChannelId, redrawPanel } from "@lib/discord";
import {
	isReady,
	normaliseVerify,
	publishVerifyPanel,
	roleTooHigh,
	VERIFY_PANEL_ID,
	type VerifyConfig,
	verifyPanel,
	recordsSettings,
} from "@lib/settings";

async function currentConfig(guildId: string): Promise<VerifyConfig> {
	return normaliseVerify(await getVerifyConfig(guildId));
}

export default recordsSettings(
	["verification.update"],
	defineButton({
		id: VERIFY_PANEL_ID,
		ownerOnly: true,

		async run(interaction, context) {
			if (interaction.guild === null) return;

			if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) !== true) {
				throw new UserFacingError(
					botCopy(
						"You need the Manage Server permission to change verification.",
						"تحتاج إلى صلاحية «إدارة الخادم» لتعديل إعدادات التحقق.",
					),
				);
			}

			const guild = interaction.guild;
			const ownerId = interaction.user.id;
			const config = await currentConfig(guild.id);

			const show = async (next: VerifyConfig, note?: string): Promise<void> => {
				const state = {
					config: next,
					roleTooHigh: roleTooHigh(guild, next.roleId),
					...(note !== undefined ? { note } : {}),
				};
				await redrawPanel(interaction, verifyPanel(state, ownerId));
			};

			switch (context.action) {
				case "channel": {
					const channelId = await pickedChannelId(interaction, guild);
					if (channelId === null) return;

					const messageId = channelId === config.channelId ? config.messageId : null;
					await saveVerifyConfig(guild.id, { channelId, messageId, message: config.message });
					await show({ ...config, channelId, messageId });
					return;
				}

				case "role": {
					if (!interaction.isRoleSelectMenu()) return;

					const [roleId] = interaction.values;
					if (roleId === undefined) return;

					await saveVerifyConfig(guild.id, { roleId, message: config.message });
					await show({ ...config, roleId });
					return;
				}

				case "edit": {
					if (!interaction.isMessageComponent()) return;

					await interaction.showModal(
						modalForm({
							id: VERIFY_PANEL_ID,
							action: "save-message",
							args: [ownerId],
							title: botCopy("What the panel says", "نص لوحة التحقق"),
							fields: [
								{
									id: "message",
									label: botCopy("Shown above the Verify button", "النص الظاهر فوق زر التحقق"),
									paragraph: true,
									value: config.message,
								},
							],
						}),
					);
					return;
				}

				case "save-message": {
					if (!interaction.isModalSubmit()) return;

					const message = interaction.fields.getTextInputValue("message").trim();
					if (message.length === 0)
						throw new UserFacingError(botCopy("The panel needs something to say.", "اكتب نصًا للوحة التحقق."));

					await saveVerifyConfig(guild.id, { message });
					const next = { ...config, message };

					if (next.messageId !== null && isReady(next)) await publishVerifyPanel(guild, next);
					await show(next, botCopy("Wording updated.", "حُدّث نص اللوحة."));
					return;
				}

				case "post": {
					if (!isReady(config))
						throw new UserFacingError(botCopy("Pick a channel and a role first.", "اختر قناة ودورًا أولًا."));

					const messageId = await publishVerifyPanel(guild, config);
					await saveVerifyConfig(guild.id, { messageId });
					await show(
						{ ...config, messageId },
						botCopy("Panel posted. Members can verify now.", "نُشرت اللوحة. يمكن للأعضاء التحقق الآن."),
					);
					return;
				}

				case "off": {
					await deleteVerifyConfig(guild.id);
					await show(
						await currentConfig(guild.id),
						botCopy(
							"Verification is off. The posted panel no longer works.",
							"عُطّل التحقق. لم تعد اللوحة المنشورة تعمل.",
						),
					);
					return;
				}

				default:
					return;
			}
		},
	}),
);
