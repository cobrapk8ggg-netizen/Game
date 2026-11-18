import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { type VerifySettings } from "@database/models/verification.schema";
import { button, channelSelect, roleSelect, row } from "@lib/discord/components.util";
import { container, containerMessage, divider, text } from "@lib/discord/containers.util";
import { type ContainerMessage, type ContainerPart } from "@lib/discord/discord.types";
import { formatNumber } from "@lib/format/format.util";
import { VERIFY_PANEL_ID } from "@lib/settings/settings.constants";
import { type VerifyConfig } from "@lib/settings/settings.types";

/** Setting up verification, as one screen rather than a command with three required options. */

export const DEFAULT_VERIFY_MESSAGE = "Press the button below to verify yourself and unlock the rest of the server.";

function defaultVerifyMessage(): string {
	return botCopy(DEFAULT_VERIFY_MESSAGE, "اضغط الزر أدناه للتحقق من حسابك والوصول إلى بقية قنوات الخادم.");
}

export type StoredVerifySettings = Omit<VerifySettings, "message"> & Partial<Pick<VerifySettings, "message">>;

export function normaliseVerify(settings: StoredVerifySettings | null): VerifyConfig {
	if (settings === null) {
		return { channelId: null, roleId: null, messageId: null, message: defaultVerifyMessage(), verifiedCount: 0 };
	}

	return {
		channelId: settings.channelId,
		roleId: settings.roleId,
		messageId: settings.messageId,
		// `?? ""` would render an empty panel, so a blank stored value falls back too.
		message: settings.message === undefined || settings.message === "" ? defaultVerifyMessage() : settings.message,
		verifiedCount: settings.verifiedIds.length,
	};
}

interface VerifyPanelState {
	config: VerifyConfig;
	/** True when the bot cannot hand out the chosen role, so the panel can say so. */
	roleTooHigh?: boolean;
	note?: string;
}

/** Everything needed before the public panel is worth posting. */
export function isReady(config: VerifyConfig): boolean {
	return config.channelId !== null && config.roleId !== null;
}

function control(action: string, ownerId: string): string {
	return customId(VERIFY_PANEL_ID, action, ownerId);
}

function summary(state: VerifyPanelState): string {
	const { config } = state;

	if (!isReady(config)) {
		const missing = [
			config.channelId === null ? botCopy("a channel", "قناة") : null,
			config.roleId === null ? botCopy("a role to grant", "دور يُمنح للأعضاء") : null,
		].filter((part): part is string => part !== null);

		return (
			botCopy("## 🛡️ Verification\n", "## 🛡️ التحقق من الأعضاء\n") +
			botCopy(
				`Not set up yet — still needs ${missing.join(" and ")}.\n`,
				`لم يُضبط التحقق بعد. المطلوب: ${missing.join("، ")}.\n`,
			) +
			botCopy(
				"-# New members press a button, type a short code, and get the role.",
				"-# يضغط العضو الجديد زر التحقق، ثم يكتب الرمز ليحصل على الدور.",
			)
		);
	}

	const posted =
		config.messageId === null
			? botCopy("Not posted yet.", "لم تُنشر اللوحة بعد.")
			: botCopy("The panel is posted.", "نُشرت اللوحة.");

	return (
		botCopy("## 🛡️ Verification\n", "## 🛡️ التحقق من الأعضاء\n") +
		botCopy(
			`Members verify in <#${config.channelId}> and are given <@&${config.roleId}>.\n`,
			`يتحقق الأعضاء من حساباتهم في <#${config.channelId}> ويحصلون على الدور <@&${config.roleId}>.\n`,
		) +
		botCopy(
			`-# ${posted} **${formatNumber(config.verifiedCount)}** verified so far.`,
			`-# ${posted} عدد الأعضاء الذين تم التحقق منهم: **${formatNumber(config.verifiedCount)}**.`,
		)
	);
}

export function verifyPanel(state: VerifyPanelState, ownerId: string): ContainerMessage {
	const { config } = state;
	const ready = isReady(config);

	const parts: ContainerPart[] = [text(summary(state))];
	if (state.note !== undefined) parts.push(text(`-# ${state.note}`));

	// The setup would look complete while every verification failed at the last step.
	if (state.roleTooHigh === true) {
		parts.push(
			text(
				botCopy(
					"⚠️ **That role sits above mine**, so I cannot give it to anyone. " +
						"Move my role higher in Server Settings → Roles, or pick a lower one.",
					"⚠️ هذا الدور أعلى من دوري، لذا لا أستطيع منحه. ارفع دوري من إعدادات الخادم ← الأدوار، أو اختر دورًا أدنى.",
				),
			),
		);
	}

	parts.push(
		divider(),
		text(botCopy(`**The panel says**\n>>> ${config.message}`, `**نص اللوحة**\n>>> ${config.message}`)),
		divider(),
		// Captioned, because two stacked menus look identical once something is chosen.
		text(
			botCopy(
				"**Panel channel**\n-# Where members find the Verify button.",
				"**قناة اللوحة**\n-# يجد الأعضاء فيها زر التحقق.",
			),
		),
		row(
			channelSelect({
				id: control("channel", ownerId),
				placeholder: botCopy("Post the verification panel in…", "اختر قناة لوحة التحقق…"),
				...(config.channelId !== null ? { defaultChannelIds: [config.channelId] } : {}),
			}),
		),
		divider({ spacer: true }),
		text(
			botCopy(
				"**Verified role**\n-# Given the moment someone passes.",
				"**دور الأعضاء المُتحقّق منهم**\n-# يُمنح عند اجتياز التحقق.",
			),
		),
		row(
			roleSelect({
				id: control("role", ownerId),
				placeholder: botCopy("Give this role once verified…", "اختر الدور الذي يُمنح بعد التحقق…"),
				...(config.roleId !== null ? { defaultRoleIds: [config.roleId] } : {}),
			}),
		),
		row(
			button({ id: control("edit", ownerId), label: botCopy("Edit the wording", "تعديل النص") }),
			button({
				id: control("post", ownerId),
				label:
					config.messageId === null
						? botCopy("Post the panel", "نشر اللوحة")
						: botCopy("Update the panel", "تحديث اللوحة"),
				style: ButtonStyle.Success,
				disabled: !ready,
			}),
			button({
				id: control("off", ownerId),
				label: botCopy("Turn off", "تعطيل التحقق"),
				style: ButtonStyle.Danger,
				disabled: !ready && config.messageId === null,
			}),
		),
	);

	return containerMessage(container({ category: "settings", parts }));
}
