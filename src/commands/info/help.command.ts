import { DEFAULT_PREFIX } from "@config/constants";
import { defineCommand } from "@core/command";
import { UserFacingError } from "@core/errors";
import { readerLanguage } from "@core/language";
import { getPrefix } from "@database/repositories/prefixRepository";
import { reply } from "@lib/discord";
import {
	arabicHelp,
	categoryControls,
	categoryMenu,
	categoryPage,
	commandPage,
	helpHome,
	helpLinks,
	pagesOf,
	resolveCategory,
} from "@lib/info";

export default defineCommand({
	name: "help",
	description: "Everything the bot can do, category by category.",
	category: "info",
	private: true,
	aliases: ["commands", "h"],
	options: [{ name: "query", description: "A command or category name.", type: "string", autocomplete: true }],

	async run(interaction, client) {
		const ar = readerLanguage(interaction, client.env.BOT_LANGUAGE) === "ar";
		const prefix = interaction.guild ? await getPrefix(interaction.guild.id) : DEFAULT_PREFIX;
		const query = interaction.options.getString("query")?.toLowerCase().trim();
		const surface = "slash";

		if (query !== undefined && query !== "") {
			const alias = client.aliases.get(query)?.split(" ")[0];
			const command = client.commands.get(query) ?? client.commands.get(alias ?? "");

			if (command) {
				await reply(interaction, { embeds: [commandPage(command, surface, prefix, ar)] });
				return;
			}

			const category = resolveCategory(query, ar);
			// A category whose every command is switched off on this bot is nothing to browse.
			const pages = category === null ? [] : pagesOf(client, category).filter((page) => page.length > 0);
			if (category !== null && pages.length > 0) {
				await reply(interaction, {
					embeds: [categoryPage(client, category, 0, surface, prefix, ar)],
					components: [
						categoryMenu(client, surface, category, interaction.user.id, ar),
						categoryControls(category, 0, pages.length, surface, interaction.user.id, ar),
					],
				});
				return;
			}

			throw new UserFacingError(
				ar ? arabicHelp.noMatch(query) : `Nothing matches \`${query}\`. Run \`/help\` on its own to browse everything.`,
			);
		}

		await reply(interaction, {
			embeds: [helpHome(client, surface, prefix, ar)],
			components: [categoryMenu(client, surface, null, interaction.user.id, ar), helpLinks(ar)],
		});
	},

	async autocomplete(interaction, client) {
		const query = interaction.options.getFocused().toLowerCase();
		const names = [...client.commands.keys()].filter((name) => name.includes(query)).slice(0, 25);
		await interaction.respond(names.map((name) => ({ name, value: name })));
	},
});
