import { ECONOMY } from "@config/constants";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { findAccount } from "@database/repositories/economyRepository";
import { embed } from "@lib/discord";
import { activeHeists } from "@lib/economy";
import { formatNumber } from "@lib/format";

export default defineButton({
	id: "heist",

	async run(interaction, context) {
		if (!interaction.isButton()) return;

		const [guildId] = context.args;
		if (guildId === undefined)
			throw new UserFacingError(botCopy("That heist has already finished.", "انتهت عملية السطو هذه بالفعل."));

		const heists = activeHeists();
		const state = heists.get(guildId);
		if (!state) throw new UserFacingError(botCopy("That heist has already finished.", "انتهت عملية السطو هذه بالفعل."));

		if (context.action === "start") {
			const [, leaderId] = context.args;
			if (leaderId !== interaction.user.id) {
				throw new UserFacingError(
					botCopy(
						"Only the person who started the heist can begin it early.",
						"لا يستطيع تقديم موعد عملية السطو إلا اللاعب الذي نظّمها.",
					),
				);
			}
			context.client.timers.stop(`heist:${guildId}`);
			await interaction.deferUpdate();
			return;
		}

		if (context.action !== "join") return;

		if (state.participants.has(interaction.user.id)) {
			throw new UserFacingError(botCopy("You are already part of this crew.", "أنت عضو في هذا الفريق بالفعل."));
		}
		if (state.participants.size >= ECONOMY.heistMaxPlayers) {
			throw new UserFacingError(botCopy("This crew is already full.", "اكتمل عدد أفراد الفريق."));
		}

		const account = await findAccount(guildId, interaction.user.id);
		if (!account || account.wallet < state.stake) {
			throw new UserFacingError(`You need **${formatNumber(state.stake)}** in your wallet to join.`);
		}

		state.participants.add(interaction.user.id);

		await interaction.update({
			embeds: [
				embed({
					category: "economy",
					title: "\u{1f3ad} Heist forming",
					description: [
						`<@${state.leaderId}> is putting a crew together.`,
						"",
						`**Stake:** ${formatNumber(state.stake)} each`,
						`**Crew:** ${state.participants.size} / ${ECONOMY.heistMaxPlayers}`,
						"",
						[...state.participants].map((id) => `<@${id}>`).join(", "),
					].join("\n"),
				}),
			],
		});
	},
});
