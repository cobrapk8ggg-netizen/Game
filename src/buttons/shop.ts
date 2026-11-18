import { type Guild } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { type EconomyAccount } from "@database/models/economy.schema";
import {
	addInventoryItem,
	adjustWallet,
	debitWallet,
	requireAccount,
	setFields,
} from "@database/repositories/economyRepository";
import {
	type Balances,
	balancesOf,
	buyShopRole,
	decodeShopState,
	findBusiness,
	findEntry,
	findHouse,
	findJob,
	findPet,
	findShopItem,
	sellConfirmScreen,
	SHOP_ID,
	shopScreen,
	type ShopState,
	rolesForSale,
} from "@lib/economy";
import { formatNumber } from "@lib/format";

/** The roles on sale are read with every screen, since a role can be moved or deleted while the shop is open. */
async function balancesFor(guild: Guild, userId: string, account: EconomyAccount): Promise<Balances> {
	const member = await guild.members.fetch(userId).catch(() => null);
	return balancesOf(account, await rolesForSale(guild, member));
}

async function purchase(state: ShopState, guild: Guild, userId: string, account: EconomyAccount): Promise<string> {
	const id = state.selectedId ?? "";
	const guildId = guild.id;

	switch (state.section) {
		case "houses": {
			const house = findHouse(id);
			if (!house)
				throw new UserFacingError(botCopy("That house is no longer for sale.", "ذلك المنزل لم يعد معروضًا للبيع."));
			if (account.house !== null)
				throw new UserFacingError(
					botCopy("You already own a house. Sell it first.", "تملك منزلًا بالفعل. بِعه أولًا."),
				);

			if (!(await debitWallet(guildId, userId, house.price))) {
				throw new UserFacingError(botCopy("You cannot afford that any more.", "لم يعد رصيدك يكفي للشراء."));
			}

			await setFields(guildId, userId, {
				house: {
					houseId: house.id,
					name: house.name,
					emoji: house.emoji,
					value: house.price,
					purchasedAt: new Date(),
				},
			});

			return `You bought ${house.emoji} **${house.name}**.`;
		}

		case "businesses": {
			const business = findBusiness(id);
			if (!business)
				throw new UserFacingError(
					botCopy("That business is no longer for sale.", "ذاك المشروع التجاري لم يعد معروضًا للبيع."),
				);
			if (account.businesses.some((owned) => owned.businessId === business.id)) {
				throw new UserFacingError(botCopy("You already own that business.", "تملك هذا المشروع التجاري بالفعل."));
			}

			if (!(await debitWallet(guildId, userId, business.price))) {
				throw new UserFacingError(botCopy("You cannot afford that any more.", "لم يعد رصيدك يكفي للشراء."));
			}

			await setFields(guildId, userId, {
				businesses: [
					...account.businesses,
					{
						businessId: business.id,
						name: business.name,
						emoji: business.emoji,
						level: 1,
						income: business.income,
						purchasedAt: new Date(),
						lastCollected: null,
					},
				],
			});

			return `You bought ${business.emoji} **${business.name}**.`;
		}

		case "jobs": {
			const job = findJob(id);
			if (!job) throw new UserFacingError(botCopy("That job is no longer going.", "تلك الوظيفة لم تعد متاحة."));

			const owned = account.inventory.filter((entry) => entry.quantity > 0).map((entry) => entry.itemId);
			const missing = job.requirements.filter((required) => !owned.includes(required));
			if (missing.length > 0) throw new UserFacingError(`You still need: ${missing.join(", ")}.`);

			await setFields(guildId, userId, { job: job.name, jobLevel: 1 });
			return `You are now a ${job.emoji} **${job.name}**.`;
		}

		case "pets": {
			const pet = findPet(id);
			if (!pet)
				throw new UserFacingError(
					botCopy("That pet is no longer available.", "ذلك الحيوان الأليف لم يعد متاحًا للتبنّي."),
				);
			if (account.pet !== null)
				throw new UserFacingError(
					botCopy("You already have a pet. Rehome it first.", "لديك حيوان أليف بالفعل. ابحث له عن منزل جديد أولًا."),
				);

			if (!(await debitWallet(guildId, userId, pet.price))) {
				throw new UserFacingError(botCopy("You cannot afford that any more.", "لم يعد رصيدك يكفي للشراء."));
			}

			await setFields(guildId, userId, {
				pet: {
					petId: pet.id,
					name: pet.name,
					type: pet.name,
					emoji: pet.emoji,
					happiness: 100,
					hunger: 100,
					purchasedAt: new Date(),
					lastFed: null,
					lastWalked: null,
				},
			});

			return `You adopted ${pet.emoji} **${pet.name}**. Look after it with \`/pet view\`.`;
		}

		case "items": {
			const item = findShopItem(id);
			if (!item)
				throw new UserFacingError(botCopy("That item is no longer for sale.", "ذلك الغرض لم يعد معروضًا للبيع."));

			if (!(await debitWallet(guildId, userId, item.price))) {
				throw new UserFacingError(botCopy("You cannot afford that any more.", "لم يعد رصيدك يكفي للشراء."));
			}

			await addInventoryItem(guildId, userId, {
				itemId: item.id,
				name: item.name,
				emoji: item.emoji,
				quantity: 1,
			});

			return `Bought ${item.emoji} **${item.name}** for **${formatNumber(item.price)}**.`;
		}

		case "roles": {
			const member = await guild.members.fetch(userId).catch(() => null);
			if (member === null)
				throw new UserFacingError(botCopy("You are no longer in this server.", "لم تعد عضوًا في هذا الخادم."));
			return buyShopRole(guild, member, id);
		}
	}
}

export default defineButton({
	id: SHOP_ID,
	ownerOnly: true,

	async run(interaction, context) {
		const guild = interaction.guild;
		if (guild === null) return;

		const guildId = guild.id;
		const userId = interaction.user.id;
		const state = decodeShopState(context.args);

		if (context.action === "pick" && interaction.isStringSelectMenu()) {
			const [picked] = interaction.values;
			await interaction.update(
				shopScreen(
					{ ...state, ...(picked !== undefined ? { selectedId: picked } : {}) },
					await balancesFor(guild, userId, await requireAccount(guildId, userId)),
					userId,
				),
			);
			return;
		}

		if (!interaction.isButton()) return;

		if (context.action === "nav" || context.action === "page") {
			const { selectedId: _cleared, ...withoutSelection } = state;
			await interaction.update(
				shopScreen(withoutSelection, await balancesFor(guild, userId, await requireAccount(guildId, userId)), userId),
			);
			return;
		}

		if (context.action === "sell") {
			const account = await requireAccount(guildId, userId);
			if (account.house === null) throw new UserFacingError(botCopy("You do not own a house.", "لا تملك منزلًا."));

			const balances = await balancesFor(guild, userId, account);
			const entry = findEntry({ section: "houses" }, balances, state.selectedId ?? "");
			if (!entry) throw new UserFacingError(botCopy("That is not something you own.", "هذا الغرض ليس من ممتلكاتك."));

			await interaction.update(sellConfirmScreen(entry, balances, userId, state));
			return;
		}

		if (context.action === "sell-no") {
			await interaction.update(
				shopScreen(
					{ section: "houses", ...(state.from ? { from: state.from } : {}) },
					await balancesFor(guild, userId, await requireAccount(guildId, userId)),
					userId,
				),
			);
			return;
		}

		if (context.action === "sell-yes") {
			const account = await requireAccount(guildId, userId);
			if (account.house === null) throw new UserFacingError(botCopy("You do not own a house.", "لا تملك منزلًا."));

			const refund = Math.floor(account.house.value / 2);
			const name = account.house.name;

			await setFields(guildId, userId, { house: null });
			await adjustWallet(guildId, userId, refund);

			const updated = await requireAccount(guildId, userId);
			await interaction.update(
				shopScreen(
					{ section: "houses", ...(state.from ? { from: state.from } : {}) },
					await balancesFor(guild, userId, updated),
					userId,
					`Sold **${name}** for **${formatNumber(refund)}**.`,
				),
			);
			return;
		}

		if (context.action !== "buy") return;

		const account = await requireAccount(guildId, userId);

		// Re-checked, since the money may have been spent after the screen rendered.
		const entry = findEntry(state, await balancesFor(guild, userId, account), state.selectedId ?? "");
		if (entry?.blocked !== undefined) throw new UserFacingError(entry.blocked);

		const message = await purchase(state, guild, userId, account);
		const updated = await requireAccount(guildId, userId);

		await interaction.update(
			shopScreen(
				{ section: state.section, ...(state.from ? { from: state.from } : {}) },
				await balancesFor(guild, userId, updated),
				userId,
				message,
			),
		);
	},
});
