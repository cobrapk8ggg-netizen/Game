import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { button, roleSelect, row } from "@lib/discord/components.util";
import { container, containerMessage, divider, text } from "@lib/discord/containers.util";
import { type ContainerMessage, type ContainerPart } from "@lib/discord/discord.types";
import { MUSIC_ID } from "@lib/music/music.constants";
import { MUSIC_LIMITS } from "@lib/music/musicSettings.util";
import { type MusicSettings } from "@testify/shared";

/** Whether the music system runs in this server, and which roles may drive it. */

export function djLine(settings: MusicSettings): string {
	if (settings.djRoleIds.length === 0)
		return botCopy("Anybody in the server can use the player.", "يستطيع جميع أعضاء الخادم استخدام المشغّل.");

	const mentions = settings.djRoleIds.map((roleId) => `<@&${roleId}>`).join(" ");
	return botCopy(
		`Only these roles can use the player: ${mentions}`,
		`لا يُتاح المشغّل إلا للأعضاء الذين يحملون إحدى هذه الرتب: ${mentions}`,
	);
}

export function musicSystemPanel(settings: MusicSettings, userId: string, note?: string): ContainerMessage {
	const parts: ContainerPart[] = [text(botCopy("## 🎛️ Music system", "## 🎛️ إعدادات تشغيل الموسيقى"))];

	if (note !== undefined) parts.push(text(`-# ${note}`));

	parts.push(
		text(
			settings.enabled
				? botCopy(
						"**On.** `/play` and the `/music` controls are available in this server.",
						"**مفعّلة.** يمكنك استخدام `/play` وأوامر التحكّم ضمن `/music` في هذا الخادم.",
					)
				: botCopy(
						"**Off.** Every music command is refused here until it is turned back on.",
						"**معطّلة.** تتوقّف أوامر الموسيقى في هذا الخادم إلى أن يُفعَّل النظام من جديد.",
					),
		),
		row(
			button({
				id: customId(MUSIC_ID, settings.enabled ? "system-off" : "system-on", userId),
				label: settings.enabled ? botCopy("Turn off", "تعطيل") : botCopy("Turn on", "تفعيل"),
				emoji: settings.enabled ? "🚫" : "✅",
				style: settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
			}),
		),
		divider(),
		text(botCopy("### 🎧 DJ roles", "### 🎧 رتب التحكّم بالمشغّل")),
		text(djLine(settings)),
		// Pre-ticked, so removing a role is deselecting it rather than a second control to find.
		row(
			roleSelect({
				id: customId(MUSIC_ID, "djroles", userId),
				placeholder: botCopy("Leave empty to let anybody use it", "اترك القائمة فارغة لإتاحة المشغّل للجميع"),
				minValues: 0,
				maxValues: MUSIC_LIMITS.maxDjRoles,
				defaultRoleIds: settings.djRoleIds,
			}),
		),
		text(
			botCopy(
				"-# Anybody with Manage Server can always use the player, whatever is chosen here.",
				"-# يظلّ المشغّل متاحًا لكل من لديه صلاحية إدارة الخادم، أيًّا كانت الرتب المحدّدة هنا.",
			),
		),
	);

	return containerMessage(container({ category: "music", parts }));
}
