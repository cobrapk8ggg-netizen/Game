import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId, defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { button, row } from "@lib/discord";
import { avatarEmbed, bannerEmbed, userInfoEmbed } from "@lib/info";

export default defineButton({
	id: "userinfo",
	ownerOnly: true,

	async run(interaction, context) {
		if (!interaction.isButton()) return;

		const [targetId, ownerId = interaction.user.id] = context.args;
		if (targetId === undefined)
			throw new UserFacingError(botCopy("That button is no longer valid.", "لم يعد هذا الزر صالحًا."));

		const target = await context.client.users.fetch(targetId).catch(() => null);
		if (!target) throw new UserFacingError(botCopy("I could not find that user any more.", "لم أجد حساب المستخدم."));

		const member = interaction.guild ? await interaction.guild.members.fetch(targetId).catch(() => null) : null;

		const controls = row(
			button({
				id: customId("userinfo", "avatar", targetId, ownerId),
				label: botCopy("Avatar", "الصورة الشخصية"),
				style: ButtonStyle.Primary,
				disabled: context.action === "avatar",
			}),
			button({
				id: customId("userinfo", "banner", targetId, ownerId),
				label: botCopy("Banner", "صورة الغلاف"),
				style: ButtonStyle.Secondary,
				disabled: context.action === "banner",
			}),
			button({
				id: customId("userinfo", "info", targetId, ownerId),
				label: botCopy("User info", "معلومات المستخدم"),
				style: ButtonStyle.Secondary,
				disabled: context.action === "info",
			}),
		);

		const embeds =
			context.action === "banner"
				? [await bannerEmbed(target)]
				: context.action === "info"
					? [userInfoEmbed(target, member)]
					: [avatarEmbed(target)];

		await interaction.update({ embeds, components: [controls] });
	},
});
