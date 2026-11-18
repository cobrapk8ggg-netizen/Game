import { PermissionsBitField, type PermissionResolvable } from "discord.js";
import { type Command, type CommandOption, type Subcommand } from "@core/command";
import { arabicDescription } from "@core/commandLocales";
import {
	type CommandCatalogue,
	type CommandOptionSummary,
	type CommandSummary,
	type SubcommandSummary,
} from "@testify/shared";

/** Turns the live command registry into the shape the dashboard reads. */

function optionOf(option: CommandOption, description: string): CommandOptionSummary {
	return {
		name: option.name,
		description,
		type: option.type,
		required: option.required ?? false,
		choices: option.choices ?? [],
		min: option.min ?? null,
		max: option.max ?? null,
	};
}

function subcommandOf(command: Command, subcommand: Subcommand, ar: boolean): SubcommandSummary {
	return {
		name: subcommand.name,
		description: ar ? arabicDescription(subcommand.description, command.name, subcommand.name) : subcommand.description,
		aliases: subcommand.aliases ?? [],
		options: (subcommand.options ?? []).map((option) =>
			optionOf(
				option,
				ar ? arabicDescription(option.description, command.name, subcommand.name, option.name) : option.description,
			),
		),
	};
}

/** Discord's own names for the flags, `ManageGuild` and so on, which each surface turns into words of its own. */
function permissionNames(permissions: PermissionResolvable[] | undefined): string[] {
	if (permissions === undefined || permissions.length === 0) return [];

	return new PermissionsBitField(permissions).toArray();
}

export function summariseCommand(command: Command, ar = false): CommandSummary {
	return {
		name: command.name,
		description: ar ? arabicDescription(command.description, command.name) : command.description,
		category: command.category,
		aliases: command.aliases ?? [],
		subcommands: (command.subcommands ?? []).map((subcommand) => subcommandOf(command, subcommand, ar)),
		options: (command.options ?? []).map((option) =>
			optionOf(
				option,
				ar ? arabicDescription(option.description, command.name, undefined, option.name) : option.description,
			),
		),
		permissions: permissionNames(command.permissions),
		botPermissions: permissionNames(command.botPermissions),
		cooldownMs: command.cooldown ?? null,
		guildOnly: command.guildOnly ?? false,
		ownerOnly: command.ownerOnly ?? false,
		nsfw: command.nsfw ?? false,
	};
}

/** Owner commands are left out for everybody else rather than shown disabled. */
export function buildCatalogue(
	commands: Iterable<Command>,
	options: { prefix: string; includeOwnerOnly: boolean; ar?: boolean },
): CommandCatalogue {
	const summaries = [...commands]
		.filter((command) => options.includeOwnerOnly || command.ownerOnly !== true)
		.map((command) => summariseCommand(command, options.ar))
		.sort((left, right) => left.name.localeCompare(right.name));

	return {
		commands: summaries,
		categories: [...new Set(summaries.map((command) => command.category))].sort((left, right) =>
			left.localeCompare(right),
		),
		prefix: options.prefix,
	};
}
