const english = {
	generic: {
		unknownCommand: (prefix: string): string =>
			`That command does not exist. Use \`${prefix}help\` to see everything I can do.`,
		guildOnly: "This command can only be used inside a server.",
		dmOnly: "This command can only be used in direct messages.",
		underDevelopment: "This command is under development and is not available yet.",
		ownerOnly: "This command is only available to the owner of the bot.",
		blacklisted: (reason: string): string => `You are blacklisted from using this bot.\nReason: ${reason}`,
		nsfwOnly: "This command can only be used in an age-restricted channel.",
		notYourComponent: "Only the person who ran the command can use these buttons.",
		cooldown: (retryIn: string): string => `Slow down — you can use this command again in ${retryIn}.`,
		profanity: "Your message includes profanity, which is not allowed here.",
		noResults: "No results found.",
		externalApi: (service: string): string => `The ${service} service is not responding right now. Try again later.`,
	},

	permissions: {
		userMissing: (missing: string[]): string =>
			`You do not have the required permissions to use this command.\nMissing: ${missing.map((p) => `\`${p}\``).join(", ")}`,
		botMissing: (missing: string[]): string =>
			`I do not have the required permissions to do that.\nMissing: ${missing.map((p) => `\`${p}\``).join(", ")}`,
	},

	economy: {
		noAccount: "You do not have an economy account yet. Create one with `/economy create`.",
		targetNoAccount: (tag: string): string => `${tag} does not have an economy account yet.`,
		insufficientWallet: (needed: number): string => `You need **${needed.toLocaleString()}** more in your wallet.`,
		insufficientBank: (needed: number): string => `You need **${needed.toLocaleString()}** more in your bank.`,
		amountPositive: "The amount has to be a positive whole number.",
		selfTarget: "You cannot target yourself with this command.",
		botTarget: "Bots do not have economy accounts.",
	},

	ticket: {
		description: "🗳️ Ticket has been opened by",
		created: "Your ticket has been created.",
		alreadyExists: "You already have a ticket open. Close the current one before opening another.",
		noPermissions: "You do not have permission to do this.",
		error: "Something went wrong, try again later.",
		missingPerms: "I am missing the permissions needed to do this. Try giving me a higher role.",
		welcomeTitle: "Welcome, and thanks for opening a ticket. Please describe your problem in detail.",
		welcomeDescription:
			"A member of the moderation team will take care of your request shortly.\nThank you for waiting patiently.",
		closeLabel: "Close",
		closeEmoji: "📪",
		lockLabel: "Lock",
		lockEmoji: "🔒",
		unlockLabel: "Unlock",
		unlockEmoji: "🔓",
		claimLabel: "Claim",
		claimEmoji: "👋",
		manageLabel: "Members",
		manageEmoji: "➕",
		manageMenuTitle: "Choose a member.",
		manageMenuEmoji: "❔",
		closingTitle: "This ticket is being closed…",
		closingDescription: "The ticket will be closed in 5 seconds.",
		locked: "Ticket was locked successfully.",
		alreadyLocked: "This ticket is already locked.",
		unlocked: "Ticket was unlocked successfully.",
		alreadyUnlocked: "This ticket is already unlocked.",
		claimed: "Ticket was successfully claimed by",
		alreadyClaimed: "Ticket is already claimed by",
		claimedBy: ", it was claimed by",
		transcriptMember: "Member:",
		transcriptTicket: "Ticket:",
		transcriptClaimed: "Claimed:",
		transcriptModerator: "Moderator:",
		transcriptTime: "Time:",
		memberAdded: "has been added to the ticket.",
		memberRemoved: "has been removed from the ticket.",
	},

	moderation: {
		hierarchyUser: "You cannot moderate someone with a role equal to or higher than yours.",
		hierarchyBot: "I cannot moderate someone with a role equal to or higher than mine.",
		notModeratable: "I am not able to moderate that member.",
		selfTarget: "You cannot use this command on yourself.",
		botTarget: "You cannot use this command on me.",
		memberNotFound: "That member is not in this server.",
		userNotFound: "I could not find that user.",
		dmFailed: "I could not send them a direct message, but the action still went through.",
	},

	testPost: {
		note: (what: string, server: string): string =>
			`-# A test of ${what} from the dashboard of **${server}**, sent only to you. The next message is what members will see.`,
		what: {
			greeting: "the welcome message",
			goodbye: "the goodbye message",
			birthday: "the birthday post",
			announcement: "an announcement",
			plain: "a message",
		},
		dmClosed:
			"Discord would not deliver a direct message to you. Allow direct messages from members of this server in your privacy settings, then try again.",
		notAMember: "You are not in this server, so there is no member to fill the message in for.",
	},

	verification: {
		alreadyVerified: "You are already verified in this server.",
		wrongCode: "That code is not correct. Try again.",
		success: "You have been verified.",
	},

	site: {
		/** The landing page's own sentence, which a pasted link to the website unfurls with. */
		preview: (bot: string): string =>
			`${bot} brings moderation, levels, music, tickets and a casino to Discord. Type a command, or set the same things up in your browser.`,
	},
} as const;

/** Widen the English literals while keeping every property and function signature. */
type Copy<T> = {
	readonly [K in keyof T]: T[K] extends string
		? string
		: T[K] extends object
			? T[K] extends (...args: never[]) => string
				? T[K]
				: Copy<T[K]>
			: T[K];
};

const arabic: Copy<typeof english> = {
	generic: {
		unknownCommand: (prefix) => `لم أجد هذا الأمر. استخدم \`${prefix}help\` للاطلاع على الأوامر المتاحة.`,
		guildOnly: "يعمل هذا الأمر داخل الخوادم فقط.",
		dmOnly: "يعمل هذا الأمر في الرسائل الخاصة فقط.",
		underDevelopment: "هذا الأمر قيد التطوير ولم يُتح بعد.",
		ownerOnly: "هذا الأمر مخصّص لمالك البوت.",
		blacklisted: (reason) => `أنت محظور من استخدام هذا البوت.\nالسبب: ${reason}`,
		nsfwOnly: "يعمل هذا الأمر في القنوات المقيّدة بحسب العمر فقط.",
		notYourComponent: "يمكن لمن نفّذ الأمر وحده استخدام هذه الأزرار.",
		cooldown: (retryIn) => `انتظر ${retryIn} ثم استخدم الأمر مجددًا.`,
		profanity: "تتضمن رسالتك ألفاظًا غير مسموح بها هنا.",
		noResults: "لم أجد نتائج.",
		externalApi: (service) => `خدمة ${service} لا تستجيب حاليًا. حاول مجددًا لاحقًا.`,
	},
	permissions: {
		userMissing: (missing) => `تحتاج إلى الصلاحيات التالية: ${missing.map((name) => `\`${name}\``).join("، ")}`,
		botMissing: (missing) => `أحتاج إلى الصلاحيات التالية: ${missing.map((name) => `\`${name}\``).join("، ")}`,
	},
	economy: {
		noAccount: "ليس لديك حساب في نظام الاقتصاد بعد. أنشئ حسابًا باستخدام `/economy create`.",
		targetNoAccount: (tag) => `ليس لدى ${tag} حساب في نظام الاقتصاد بعد.`,
		insufficientWallet: (needed) => `ينقصك **${needed.toLocaleString("ar")}** في محفظتك.`,
		insufficientBank: (needed) => `ينقصك **${needed.toLocaleString("ar")}** في حسابك المصرفي.`,
		amountPositive: "أدخل مبلغًا صحيحًا أكبر من الصفر.",
		selfTarget: "لا يمكنك استخدام هذا الأمر على نفسك.",
		botTarget: "لا تملك البوتات حسابات في نظام الاقتصاد.",
	},
	ticket: {
		description: "🗳️ فتح التذكرة",
		created: "فُتحت تذكرتك.",
		alreadyExists: "لديك تذكرة مفتوحة. أغلقها قبل فتح تذكرة أخرى.",
		noPermissions: "ليست لديك صلاحية تنفيذ هذا الإجراء.",
		error: "تعذّر إتمام الإجراء. حاول مجددًا لاحقًا.",
		missingPerms: "ليست لديّ الصلاحيات اللازمة. جرّب رفع دوري في ترتيب أدوار الخادم.",
		welcomeTitle: "مرحبًا بك. صِف مشكلتك بالتفصيل.",
		welcomeDescription: "سيتابع أحد المشرفين طلبك قريبًا. شكرًا لانتظارك.",
		closeLabel: "إغلاق التذكرة",
		closeEmoji: english.ticket.closeEmoji,
		lockLabel: "قفل",
		lockEmoji: english.ticket.lockEmoji,
		unlockLabel: "إلغاء القفل",
		unlockEmoji: english.ticket.unlockEmoji,
		claimLabel: "تولّي التذكرة",
		claimEmoji: english.ticket.claimEmoji,
		manageLabel: "الأعضاء",
		manageEmoji: english.ticket.manageEmoji,
		manageMenuTitle: "اختر عضوًا.",
		manageMenuEmoji: english.ticket.manageMenuEmoji,
		closingTitle: "جارٍ إغلاق التذكرة…",
		closingDescription: "ستُغلق التذكرة بعد خمس ثوانٍ.",
		locked: "قُفلت التذكرة.",
		alreadyLocked: "التذكرة مقفلة بالفعل.",
		unlocked: "أُلغي قفل التذكرة.",
		alreadyUnlocked: "التذكرة غير مقفلة.",
		claimed: "تولّى التذكرة",
		alreadyClaimed: "يتولّى هذه التذكرة بالفعل",
		claimedBy: "، وقد تولّاها",
		transcriptMember: "العضو:",
		transcriptTicket: "التذكرة:",
		transcriptClaimed: "المكلّف:",
		transcriptModerator: "المشرف:",
		transcriptTime: "الوقت:",
		memberAdded: "أُضيف إلى التذكرة.",
		memberRemoved: "أُزيل من التذكرة.",
	},
	moderation: {
		hierarchyUser: "لا يمكنك الإشراف على عضو يملك دورًا يساوي أعلى أدوارك أو يعلوه.",
		hierarchyBot: "لا يمكنني الإشراف على عضو يملك دورًا يساوي أعلى أدواري أو يعلوه.",
		notModeratable: "لا أستطيع اتخاذ هذا الإجراء بحق العضو.",
		selfTarget: "لا يمكنك تنفيذ هذا الأمر على نفسك.",
		botTarget: "لا يمكنك تنفيذ هذا الأمر عليّ.",
		memberNotFound: "العضو غير موجود في هذا الخادم.",
		userNotFound: "لم أجد هذا المستخدم.",
		dmFailed: "نُفّذ الإجراء، لكن تعذّر إرسال رسالة خاصة إلى العضو.",
	},
	testPost: {
		note: (what, server) =>
			`-# أُرسلت إليك وحدك معاينة ${what} من لوحة تحكم **${server}**. سيظهر للأعضاء محتوى الرسالة التالية.`,
		what: {
			greeting: "رسالة الترحيب",
			goodbye: "رسالة الوداع",
			birthday: "منشور عيد الميلاد",
			announcement: "الإعلان",
			plain: "الرسالة",
		},
		dmClosed:
			"تعذّر على Discord إيصال الرسالة الخاصة. فعّل استقبال الرسائل الخاصة من أعضاء هذا الخادم في إعدادات الخصوصية، ثم حاول مجددًا.",
		notAMember: "لست عضوًا في هذا الخادم، لذلك لا يمكن ملء الرسالة ببيانات عضويتك.",
	},
	verification: {
		alreadyVerified: "سبق التحقق من حسابك في هذا الخادم.",
		wrongCode: "رمز التحقق غير صحيح. حاول مجددًا.",
		success: "تم التحقق من حسابك.",
	},
	site: {
		preview: (bot) =>
			`يوفّر ${bot} أدوات الإشراف والمستويات والموسيقى والتذاكر والكازينو في Discord. استخدم الأوامر أو اضبط الإعدادات من المتصفح.`,
	},
};

export let strings: Copy<typeof english> = english;

export function setBotCopyLanguage(language: string | undefined): void {
	strings = language === "ar" ? arabic : english;
}

/** Selects a bot-authored message. Arguments embedded in it keep the text supplied by the caller. */
export function botCopy(original: string, translation: string): string {
	return strings === arabic ? translation : original;
}
