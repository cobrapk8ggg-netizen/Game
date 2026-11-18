import { botCopy } from "@config/strings";
import { type Problem, type ProblemCode } from "@testify/shared";

/** The displayed sentence for a refusal `@testify/shared` names, so the rule lives there and the wording here. */

const SENTENCES: Record<ProblemCode, (values: Record<string, number>) => string> = {
	"automod.word": () => botCopy("Type the word or phrase to block.", "اكتب الكلمة أو العبارة المراد حظرها."),
	"automod.mentionLimit": () =>
		botCopy("Choose how many mentions to allow.", "حدّد عدد الإشارات المسموح به في الرسالة."),
	"giveaway.channel": () => botCopy("Pick a channel to post it in.", "اختر قناة لنشر السحب فيها."),
	"giveaway.prize": () => botCopy("Say what is being given away.", "اكتب اسم جائزة السحب."),
	"giveaway.prizeLength": ({ max = 0 }) =>
		botCopy(
			`The prize cannot be longer than ${String(max)} characters.`,
			`الحد الأقصى لطول وصف الجائزة هو ${String(max)} حرفًا.`,
		),
	"giveaway.winners": () => botCopy("There has to be at least one winner.", "يجب أن يكون للسحب فائز واحد على الأقل."),
	"giveaway.maxWinners": ({ max = 0 }) =>
		botCopy(
			`Discord will not let one giveaway have more than ${String(max)} winners.`,
			`يسمح Discord بحد أقصى قدره ${String(max)} فائزًا في السحب الواحد.`,
		),
	"giveaway.tooShort": () =>
		botCopy("A giveaway has to run for at least a minute.", "يجب أن يستمر السحب دقيقة واحدة على الأقل."),
	"giveaway.tooLong": () =>
		botCopy("A giveaway cannot run for longer than 30 days.", "الحد الأقصى لمدة السحب ثلاثون يومًا."),
	"lottery.channel": () => botCopy("Choose where draws are announced.", "اختر قناة لإعلان نتائج السحب."),
	"lottery.entryFee": ({ min = 0 }) =>
		botCopy(`A ticket has to cost at least ${String(min)}.`, `الحد الأدنى لسعر التذكرة هو ${String(min)}.`),
	"money.amount": () => botCopy("Enter an amount to add or take away.", "أدخل المبلغ المراد إضافته أو خصمه."),
	"money.tooLarge": ({ max = 0 }) =>
		botCopy(
			`One change cannot be more than ${max.toLocaleString()}.`,
			`الحد الأقصى للتعديل الواحد هو ${max.toLocaleString("ar")}.`,
		),
	"money.walletShort": ({ held = 0 }) =>
		botCopy(
			`They only have ${held.toLocaleString()} in their wallet.`,
			`رصيد محفظة العضو هو ${held.toLocaleString("ar")} فقط.`,
		),
	"money.bankShort": ({ held = 0 }) =>
		botCopy(
			`They only have ${held.toLocaleString()} in their bank.`,
			`رصيد الحساب المصرفي للعضو هو ${held.toLocaleString("ar")} فقط.`,
		),
	"warning.reason": () => botCopy("Say why they are being warned.", "اكتب سبب التحذير."),
	"warning.reasonLength": ({ max = 0 }) =>
		botCopy(
			`A reason cannot be longer than ${String(max)} characters.`,
			`الحد الأقصى لطول السبب هو ${String(max)} حرفًا.`,
		),
	"sticky.channel": () => botCopy("Pick a channel for this sticky.", "اختر قناة للرسالة الدائمة."),
	"sticky.duplicate": () =>
		botCopy(
			"That channel already has a sticky. Edit the existing one instead.",
			"توجد رسالة دائمة في هذه القناة بالفعل. عدّل الرسالة الموجودة.",
		),
	"sticky.message": () => botCopy("A sticky needs something to say.", "اكتب نص الرسالة الدائمة."),
	"ticket.panelChannel": () => botCopy("Choose where the panel is posted.", "اختر قناة لنشر لوحة التذاكر."),
	"ticket.category": () =>
		botCopy("Choose the category new tickets are created in.", "اختر الفئة التي ستُنشأ فيها قنوات التذاكر."),
	"ticket.transcriptChannel": () =>
		botCopy("Choose where transcripts are sent.", "اختر قناة لإرسال سجلات التذاكر إليها."),
	"ticket.staffRole": () => botCopy("Choose the role that handles tickets.", "اختر الدور المسؤول عن متابعة التذاكر."),
	"treasure.messageRange": () =>
		botCopy(
			"The fewest messages cannot be more than the most.",
			"يجب ألّا يتجاوز الحد الأدنى لعدد الرسائل الحد الأقصى.",
		),
	"treasure.amountRange": () =>
		botCopy("The smallest drop cannot be more than the largest.", "يجب ألّا يتجاوز أصغر مبلغ للكنز أكبر مبلغ."),
	"casino.betRange": () =>
		botCopy("The smallest bet cannot be more than the largest.", "يجب ألّا يتجاوز الحد الأدنى للرهان الحد الأقصى."),
	"roleMenu.channel": () => botCopy("Choose where the menu is posted.", "اختر قناة لنشر قائمة الأدوار."),
	"roleMenu.title": () => botCopy("Give the menu a title.", "اكتب عنوانًا لقائمة الأدوار."),
	"roleMenu.roles": () => botCopy("Pick at least one role to offer.", "اختر دورًا واحدًا على الأقل."),
	"roleMenu.tooManyRoles": ({ max = 0 }) =>
		botCopy(
			`One menu cannot offer more than ${String(max)} roles.`,
			`الحد الأقصى لعدد الأدوار في القائمة الواحدة هو ${String(max)}.`,
		),
	"autoResponder.trigger": () => botCopy("Say which words it answers.", "حدّد الكلمات التي تستدعي الرد."),
	"autoResponder.reply": () => botCopy("Write what it replies with.", "اكتب نص الرد التلقائي."),
	"autoResponder.duplicate": () =>
		botCopy(
			"There is already an auto-responder for those words. Edit that one instead.",
			"يوجد رد تلقائي لهذه الكلمات بالفعل. عدّل الرد الموجود.",
		),
	"schedule.channel": () => botCopy("Choose the channel it is posted in.", "اختر القناة التي ستُنشر فيها الرسالة."),
	"schedule.message": () => botCopy("Write the message to post.", "اكتب نص الرسالة المراد نشرها."),
	"schedule.time": () =>
		botCopy("Say when to post it, such as `30m`, `2h` or `1d`.", `حدّد موعد النشر، مثل \`30m\` أو \`2h\` أو \`1d\`.`),
	"schedule.past": () =>
		botCopy(
			"That time has already gone. Pick one at least a minute from now.",
			"انقضى الموعد المحدد. اختر موعدًا يبعد دقيقة واحدة على الأقل.",
		),
	"schedule.tooFar": ({ max = 0 }) =>
		botCopy(
			`A message can be scheduled at most ${String(max)} days ahead.`,
			`يمكن جدولة الرسالة في حدود ${String(max)} يومًا من الآن.`,
		),
	"notice.startPast": () =>
		botCopy(
			"That time has already gone. Pick one at least a minute from now, or post it now.",
			"انقضى الموعد المحدد. انشر الإشعار الآن أو اختر موعدًا يبعد دقيقة واحدة على الأقل.",
		),
	"notice.startTooFar": ({ max = 0 }) =>
		botCopy(
			`A notification can go up at most ${String(max)} days ahead.`,
			`يمكن جدولة الإشعار في حدود ${String(max)} يومًا من الآن.`,
		),
	"notice.endBeforeStart": () =>
		botCopy(
			"It has to come down after it goes up, and later than now.",
			"اختر موعد انتهاء يأتي بعد موعد النشر وبعد الوقت الحالي.",
		),
	"notice.endTooLong": ({ max = 0 }) =>
		botCopy(
			`A notification can stay up for at most ${String(max)} days.`,
			`الحد الأقصى لمدة عرض الإشعار هو ${String(max)} يومًا.`,
		),
};

export function problemText(problem: Problem): string;
export function problemText(problem: Problem | null): string | null;
export function problemText(problem: Problem | null): string | null {
	return problem === null ? null : SENTENCES[problem.code](problem.values ?? {});
}
