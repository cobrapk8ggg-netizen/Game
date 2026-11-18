import { type APIEmbedField, type EmbedBuilder, type GuildMember, type User } from "discord.js";
import { botCopy } from "@config/strings";
import { embed } from "@lib/discord/embeds.util";
import { discordTime } from "@lib/format/format.util";

export function avatarEmbed(user: User): EmbedBuilder {
	const url = user.displayAvatarURL({ size: 1024 });
	return embed({
		category: "info",
		title: botCopy(`${user.username}'s avatar`, `الصورة الشخصية لـ ${user.username}`),
		url,
		image: url,
	});
}

export async function bannerEmbed(user: User): Promise<EmbedBuilder> {
	const fetched = await user.fetch(true);
	const url = fetched.bannerURL({ size: 1024 });

	if (url === null || url === undefined) {
		return embed({
			category: "info",
			title: botCopy(`${user.username}'s banner`, `صورة غلاف ${user.username}`),
			description: botCopy("This user does not have a banner.", "لم يضع هذا المستخدم صورة غلاف."),
		});
	}

	return embed({
		category: "info",
		title: botCopy(`${user.username}'s banner`, `صورة غلاف ${user.username}`),
		url,
		image: url,
	});
}

export function userInfoEmbed(user: User, member: GuildMember | null): EmbedBuilder {
	const fields: APIEmbedField[] = [
		{ name: botCopy("Username", "اسم المستخدم"), value: user.username, inline: true },
		{ name: botCopy("ID", "المعرّف"), value: user.id, inline: true },
		{ name: botCopy("Bot", "حساب بوت"), value: user.bot ? botCopy("Yes", "نعم") : botCopy("No", "لا"), inline: true },
		{ name: botCopy("Account created", "تاريخ إنشاء الحساب"), value: discordTime(user.createdAt, "R"), inline: true },
	];

	if (member) {
		fields.push(
			{
				name: botCopy("Joined server", "تاريخ الانضمام"),
				value: member.joinedAt ? discordTime(member.joinedAt, "R") : botCopy("Unknown", "غير معروف"),
				inline: true,
			},
			{ name: botCopy("Nickname", "اللقب"), value: member.nickname ?? botCopy("None", "لا يوجد"), inline: true },
			{
				name: botCopy("Highest role", "أعلى دور"),
				value: member.roles.highest.name === "@everyone" ? botCopy("None", "لا يوجد") : member.roles.highest.toString(),
				inline: true,
			},
			{
				name: botCopy(`Roles (${member.roles.cache.size - 1})`, `الأدوار (${member.roles.cache.size - 1})`),
				value:
					member.roles.cache
						.filter((role) => role.name !== "@everyone")
						.sort((a, b) => b.position - a.position)
						.map((role) => role.toString())
						.slice(0, 20)
						.join(" ") || botCopy("None", "لا يوجد"),
			},
			{
				name: botCopy("Boosting since", "تاريخ بدء التعزيز"),
				value: member.premiumSince ? discordTime(member.premiumSince, "R") : botCopy("Not boosting", "لا يعزّز الخادم"),
				inline: true,
			},
		);
	}

	return embed({
		category: "info",
		title: user.displayName,
		fields,
		thumbnail: user.displayAvatarURL({ size: 512 }),
		footer: botCopy(`User ID: ${user.id}`, `معرّف المستخدم: ${user.id}`),
	});
}
