import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { defineCommand } from "@core/command";
import { button, reply, row } from "@lib/discord";
import { avatarEmbed } from "@lib/info";

export default defineCommand({
	name: "avatar",
	description: "Shows a user's avatar and banner.",
	category: "info",
	aliases: ["av", "pfp"],
	options: [{ name: "user", description: "The user to look up. Defaults to you.", type: "user" }],

	async run(interaction) {
		const target = interaction.options.getUser("user") ?? interaction.user;

		await reply(interaction, {
			embeds: [avatarEmbed(target)],
			components: [
				row(
					button({
						id: customId("userinfo", "avatar", target.id, interaction.user.id),
						label: botCopy("Avatar", "الصورة الشخصية"),
						style: ButtonStyle.Primary,
						disabled: true,
					}),
					button({
						id: customId("userinfo", "banner", target.id, interaction.user.id),
						label: botCopy("Banner", "صورة الغلاف"),
						style: ButtonStyle.Secondary,
					}),
					button({
						id: customId("userinfo", "info", target.id, interaction.user.id),
						label: botCopy("User info", "معلومات المستخدم"),
						style: ButtonStyle.Secondary,
					}),
				),
			],
		});
	},
});
