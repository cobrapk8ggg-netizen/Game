import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { disableWelcome, getWelcome, saveWelcome } from "@database/repositories/welcomeRepository";
import { modalForm, pickedChannelId, redrawPanel } from "@lib/discord";
import { recordsSettings } from "@lib/settings";
import {
	DEFAULT_WELCOME_MESSAGE,
	greetingFor,
	isWelcomeStyle,
	normaliseWelcome,
	WELCOME_LIMITS,
	WELCOME_PANEL_ID,
	type WelcomeConfig,
	welcomePanel,
} from "@lib/welcome";

async function currentConfig(guildId: string): Promise<WelcomeConfig | null> {
	return normaliseWelcome(await getWelcome(guildId));
}

export default recordsSettings(
	["welcome.update"],
	defineButton({
		id: WELCOME_PANEL_ID,
		ownerOnly: true,

		async run(interaction, context) {
			if (interaction.guild === null) return;

			if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) !== true) {
				throw new UserFacingError(
					botCopy(
						"You need the Manage Server permission to change the welcome messages.",
						"تحتاج إلى صلاحية «إدارة الخادم» لتعديل رسائل الترحيب.",
					),
				);
			}

			const guild = interaction.guild;
			const ownerId = interaction.user.id;
			const config = await currentConfig(guild.id);

			const show = async (next: WelcomeConfig | null, note?: string): Promise<void> => {
				await redrawPanel(
					interaction,
					welcomePanel({ config: next, ...(note !== undefined ? { note } : {}) }, ownerId),
				);
			};

			switch (context.action) {
				case "channel": {
					const channelId = await pickedChannelId(interaction, guild);
					if (channelId === null) return;

					const saved = await saveWelcome(guild.id, {
						channelId,
						...(config === null ? { message: DEFAULT_WELCOME_MESSAGE, style: "card" as const } : {}),
					});

					await show(
						normaliseWelcome(saved),
						config === null
							? botCopy("Set up. Press Preview to see it.", "حُفظ الإعداد. اضغط «معاينة» لرؤية الرسالة.")
							: undefined,
					);
					return;
				}

				case "style": {
					if (config === null) return;

					const [style] = context.args;
					if (style === undefined || !isWelcomeStyle(style)) return;

					await saveWelcome(guild.id, { style });
					await show({ ...config, style });
					return;
				}

				case "edit": {
					if (!interaction.isMessageComponent()) return;
					if (config === null) throw new UserFacingError(botCopy("Pick a channel first.", "اختر قناة الترحيب أولًا."));

					await interaction.showModal(
						modalForm({
							id: WELCOME_PANEL_ID,
							action: "save-message",
							args: [ownerId],
							title: botCopy("The welcome message", "رسالة الترحيب"),
							fields: [
								{
									id: "message",
									label: botCopy("Use {user}, {server} and {count}", "يمكنك إدراج {user} و{server} و{count}"),
									paragraph: true,
									value: config.message,
									maxLength: WELCOME_LIMITS.maxMessage,
								},
							],
						}),
					);
					return;
				}

				case "save-message": {
					if (!interaction.isModalSubmit()) return;
					if (config === null) return;

					const message = interaction.fields.getTextInputValue("message").trim();
					if (message.length === 0)
						throw new UserFacingError(botCopy("The greeting cannot be empty.", "اكتب نص رسالة الترحيب."));

					await saveWelcome(guild.id, { message });
					await show({ ...config, message }, botCopy("Message updated.", "حُدّث نص الرسالة."));
					return;
				}

				case "preview": {
					if (config === null) return;
					if (interaction.member === null) return;

					const member = await guild.members.fetch(ownerId).catch(() => null);
					if (member === null)
						throw new UserFacingError(
							botCopy(
								"I could not read your member profile to build a preview.",
								"تعذّر قراءة بيانات عضويتك لإنشاء المعاينة.",
							),
						);

					const greeting = await greetingFor(member, config, await getWelcome(guild.id));
					await interaction.reply({ ...greeting, flags: MessageFlags.Ephemeral });
					return;
				}

				case "clear-bg": {
					if (config === null) return;

					await saveWelcome(guild.id, { background: null });
					await show(
						{ ...config, hasBackground: false },
						botCopy(
							"Background removed. The card uses the default again.",
							"أُزيلت الخلفية المخصصة. تستخدم البطاقة الخلفية الافتراضية الآن.",
						),
					);
					return;
				}

				case "off": {
					await disableWelcome(guild.id);
					await show(null, botCopy("Nobody will be greeted from now on.", "عُطّل إرسال رسائل الترحيب."));
					return;
				}

				default:
					return;
			}
		},
	}),
);
