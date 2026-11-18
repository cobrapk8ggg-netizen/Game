import { PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { type ComponentInteraction, defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { modalForm, pickedChannelId, redrawPanel } from "@lib/discord";
import {
	changeSchedule,
	nextRepeat,
	postIn,
	readSchedule,
	readSchedules,
	removeSchedule,
	SCHEDULE_PANEL_ID,
	scheduleEditor,
	scheduleHub,
} from "@lib/scheduledMessages";
import { SCHEDULE_LIMITS } from "@testify/shared";

function typed(interaction: ComponentInteraction, field: string): string {
	if (!interaction.isModalSubmit())
		throw new UserFacingError(botCopy("Open the form again and fill it in.", "أعد فتح النموذج واملأ الحقول المطلوبة."));
	return interaction.fields.getTextInputValue(field);
}

export default defineButton({
	id: SCHEDULE_PANEL_ID,
	ownerOnly: true,

	async run(interaction, context) {
		const guild = interaction.guild;
		if (guild === null) return;

		if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) !== true) {
			throw new UserFacingError(
				botCopy(
					"You need the Manage Server permission to change scheduled messages.",
					"تحتاج إلى صلاحية إدارة الخادم لتعديل الرسائل المجدولة.",
				),
			);
		}

		const ownerId = interaction.user.id;
		const [id = ""] = context.args;
		const editor = async (note?: string, confirmingDelete = false): Promise<void> =>
			redrawPanel(
				interaction,
				scheduleEditor(
					{
						schedule: await readSchedule(guild, id),
						...(note === undefined ? {} : { note }),
						confirmingDelete,
					},
					ownerId,
				),
			);

		switch (context.action) {
			case "open": {
				if (!interaction.isStringSelectMenu()) return;
				const schedule = await readSchedule(guild, interaction.values[0] ?? "");
				await redrawPanel(interaction, scheduleEditor({ schedule }, ownerId));
				return;
			}

			case "time":
				if (interaction.isButton()) {
					await interaction.showModal(
						modalForm({
							id: SCHEDULE_PANEL_ID,
							action: "save-time",
							args: [id, ownerId],
							title: botCopy("When to post it", "موعد النشر"),
							fields: [
								{
									id: "in",
									label: botCopy("How long from now", "المدة المتبقّية حتى النشر"),
									placeholder: botCopy("30m, 2h or 3d", "مثل 30m أو 2h أو 3d"),
								},
							],
						}),
					);
				}
				return;

			case "save-time":
				await changeSchedule(guild, id, { nextAt: postIn(typed(interaction, "in")) }, ownerId);
				await editor(botCopy("Moved.", "عُدّل موعد النشر."));
				return;

			case "edit":
				if (interaction.isButton()) {
					await interaction.showModal(
						modalForm({
							id: SCHEDULE_PANEL_ID,
							action: "save-message",
							args: [id, ownerId],
							title: botCopy("Scheduled message", "رسالة مجدولة"),
							fields: [
								{
									id: "message",
									label: botCopy("What to post", "نص الرسالة"),
									paragraph: true,
									maxLength: SCHEDULE_LIMITS.maxMessage,
									value: (await readSchedule(guild, id)).message,
								},
							],
						}),
					);
				}
				return;

			case "save-message":
				await changeSchedule(guild, id, { message: typed(interaction, "message") }, ownerId);
				await editor(botCopy("Saved.", "حُفظت الرسالة."));
				return;

			case "repeat": {
				const current = await readSchedule(guild, id);
				await changeSchedule(guild, id, { repeat: nextRepeat(current.repeat) }, ownerId);
				await editor();
				return;
			}

			case "channel": {
				const channelId = await pickedChannelId(interaction, guild);
				if (channelId === null) return;
				await changeSchedule(guild, id, { channelId }, ownerId);
				await editor(botCopy(`It will post in <#${channelId}>.`, `ستُنشر الرسالة في <#${channelId}>.`));
				return;
			}

			case "delete":
			case "delete-no":
				await editor(undefined, context.action === "delete");
				return;

			case "delete-yes":
				await removeSchedule(guild, id);
				await redrawPanel(
					interaction,
					scheduleHub(
						(await readSchedules(guild)).messages,
						ownerId,
						botCopy("Deleted. It will not be posted.", "حُذفت الرسالة من جدول النشر."),
					),
				);
				return;

			case "hub":
				await redrawPanel(interaction, scheduleHub((await readSchedules(guild)).messages, ownerId));
				return;
		}
	},
});
