/**
 * Every piece of interface text, in English and German. Pages pick the visitor's language
 * (page.data.lang in components, locals.lang on the server) and read from msgs(lang).
 * To add a text: add it to `en`, then TypeScript insists on the German one in `de`.
 */
import type { BestOf } from './types';

export type Lang = 'en' | 'de';
export const langs: Lang[] = ['en', 'de'];
export const isLang = (s: unknown): s is Lang => s === 'en' || s === 'de';
export const LANG_COOKIE = 'lang';

const s = (n: number, one: string, many: string) => (n === 1 ? one : many);

const en = {
	locale: 'en-GB',
	nav: {
		tournaments: 'Tournaments',
		players: 'Players',
		organisers: 'Organisers',
		signOut: 'Sign out',
		setUp: 'Set up',
		signIn: 'Sign in',
		language: 'Language'
	},
	signedInAs: (user: string) => `signed in as ${user}`,
	status: { open: 'In progress', finished: 'Finished' },
	removedPlayer: 'Removed player',
	noDate: 'No date',
	field: {
		name: 'Name',
		date: 'Date',
		courts: 'Courts',
		asManyAsNeeded: 'As many as needed',
		setsPerMatch: 'Sets per match',
		format: 'Format',
		username: 'Username',
		password: 'Password'
	},
	cancel: 'Cancel',
	/** In the sets-per-match picker. */
	bestOf: (n: BestOf) => (n === 1 ? 'One set' : `Best of ${n}`),
	/** In running text. */
	bestOfText: (n: BestOf) => (n === 1 ? 'one set' : `best of ${n} sets`),
	formats: {
		random_doubles: {
			name: 'Random-partner doubles',
			description:
				'Every round shuffles all players into new doubles pairs, avoiding repeat partners and opponents where possible. Each player keeps the points their pair scores.'
		}
	},

	home: {
		title: 'Tournaments',
		needsSetup: 'This site has no organiser yet.',
		setupLink: 'Create the first organiser account',
		needsSetupEnd: ' to start running tournaments.',
		newTournament: 'New tournament',
		namePlaceholder: 'Thursday club night',
		create: 'Create and add players',
		emptyTitle: 'No tournaments yet',
		emptyAdmin: 'Create one, add the players who turned up, and draw the first round.',
		emptyViewer: 'Tournaments appear here once an organiser creates one.',
		current: 'Current',
		finished: 'Finished',
		players: 'players',
		rounds: 'rounds',
		scored: 'scored'
	},

	tournament: {
		notFound: 'Tournament not found',
		allTournaments: 'All tournaments',
		rounds: (n: number) => `${n} ${s(n, 'round', 'rounds')}`,
		nPlaying: (n: number) => `${n} playing`,
		matchesScored: (done: number, total: number) => `${done} of ${total} ${s(total, 'match', 'matches')} scored`,
		sections: 'Tournament sections',
		tabRounds: 'Rounds',
		tabStandings: 'Standings',
		tabLineup: 'Line-up',
		round: (n: number) => `Round ${n}`,
		needPlayers: (need: number, have: number) => `Add at least ${need} players to draw a round (${have} playing).`,
		drawSummary: (playing: number, courts: number, sitting: number) =>
			`${playing} playing · ${courts} ${s(courts, 'court', 'courts')} · ${sitting} sitting out`,
		matches: 'Matches',
		change: 'change',
		redrawAsk: (n: number) => `Remove round ${n} so you can draw it again?`,
		redraw: (n: number) => `Redraw round ${n}`,
		draw: (n: number) => `Draw round ${n}`,
		drawAnyway: (round: number, open: number, next: number) =>
			`Round ${round} still has ${open} ${s(open, 'match', 'matches')} without a score. Draw round ${next} anyway?`,
		noRoundsTitle: 'No rounds yet',
		noRounds: 'Each round shuffles everyone into new doubles pairs, avoiding repeat partners where possible.',
		addPlayers: 'Add players',
		scoredOf: (done: number, total: number) => `${done} of ${total} scored`,
		sittingOut: 'Sitting out:',
		clubPlayers: 'Club players',
		selectAll: 'Select all',
		clear: 'Clear',
		newPlayers: 'New players',
		namesPlaceholder: 'Anna, Ben, Chloe…',
		namesHint: 'Separate names with commas or new lines. New names are added to the club list too.',
		addToTournament: 'Add to tournament',
		noPlayersTitle: 'No players yet',
		noPlayersAdmin: 'Add everyone who is playing. You need at least 4 for one court.',
		noPlayersViewer: 'The organiser hasn’t added players yet.',
		playedCount: (played: number, byes: number) => `${played} played${byes ? ` · ${byes} sat out` : ''}`,
		active: 'Playing',
		inactive: 'Not playing',
		remove: 'Remove',
		left: 'Left',
		activeHint: 'Switch someone to “Not playing” if they leave early. They keep their results and aren’t drawn into new rounds.',
		settings: 'Tournament settings',
		settingsHint: 'Changing sets per match applies to results entered from now on. Results already saved keep their sets.',
		saveSettings: 'Save settings',
		saved: 'Saved.',
		finishTitle: 'Finish tournament',
		reopenTitle: 'Reopen tournament',
		finishHint: 'Finishing stops new rounds being drawn. Results stay visible and you can reopen it later.',
		reopenHint: 'Reopen to draw more rounds.',
		markFinished: 'Mark as finished',
		reopen: 'Reopen',
		deleteTitle: 'Delete tournament',
		deleteHint: 'Deletes every round and result in this tournament. Players stay in the club list. This can’t be undone.',
		deleteConfirm: (name: string) => `Type “${name}” to confirm`
	},

	match: {
		court: (n: number) => `Court ${n}`,
		done: 'Final',
		todo: 'To play',
		won: 'Won',
		set: (n: number) => `Set ${n}`,
		ifNeeded: 'if needed',
		pointsFor: (set: number, team: string) => `Set ${set} points for ${team}`,
		and: 'and',
		save: 'Save result',
		edit: 'Edit',
		clear: 'Clear result',
		clearAsk: 'Clear this result? The match goes back to unplayed.',
		finalScore: 'Final score',
		setsWon: 'Sets won',
		setScores: 'Set scores',
		waiting: 'Waiting for the result'
	},

	standings: {
		emptyTitle: 'No results yet',
		empty: 'Standings fill in as soon as the first result is saved.',
		player: 'Player',
		p: 'P',
		pTitle: 'Matches played',
		w: 'W',
		wTitle: 'Matches won',
		l: 'L',
		lTitle: 'Matches lost',
		sets: 'Sets',
		setsTitle: 'Sets won – sets lost',
		pts: 'Pts',
		ptsTitle: 'Points scored in all sets',
		agst: 'Agst',
		agstTitle: 'Points conceded',
		diffTitle: 'Point difference',
		hint: 'Ranked by matches won, then sets won, then points scored across all sets. Players level on all three share a place. Each player is credited with their pair’s result.'
	},

	players: {
		eyebrow: 'All tournaments',
		title: 'Club players',
		lead: 'Career totals from every scored match, across all tournaments.',
		addLabel: 'Add club players',
		add: 'Add',
		addHint: 'Separate several names with commas or new lines. You can also add players straight from a tournament.',
		emptyTitle: 'No players yet',
		empty: 'Players appear here once they are added to the club or a tournament.',
		player: 'Player',
		events: 'Events',
		played: 'Played',
		won: 'Won',
		winPct: 'Win %',
		sets: 'Sets',
		archived: 'archived',
		newName: 'New name',
		save: 'Save',
		rename: 'Rename',
		archive: 'Archive',
		restore: 'Restore',
		rankHint: 'Ranked by win % across all tournaments, then by matches won. Points are shown in each tournament’s standings.',
		showArchived: (n: number) => `Show ${n} archived ${s(n, 'player', 'players')}`
	},

	admin: {
		eyebrow: 'Site access',
		title: 'Organisers',
		lead: 'Organisers can create tournaments, manage players, draw rounds and enter scores.',
		added: 'Added',
		you: 'you',
		addTitle: 'Add an organiser',
		shareHint: 'Share the password with them in person; they can change it after signing in.',
		addButton: 'Add organiser',
		canSignIn: (user: string) => `${user} can now sign in.`,
		changeTitle: 'Change your password',
		current: 'Current password',
		next: 'New password',
		changeButton: 'Change password',
		changed: 'Password changed.'
	},

	login: {
		eyebrow: 'Organisers',
		title: 'Sign in',
		lead: 'Only organisers need an account. Results and standings are open to everyone.',
		button: 'Sign in',
		tooMany: 'Too many attempts. Wait 15 minutes and try again.',
		mismatch: 'That username and password don’t match.'
	},

	setup: {
		eyebrow: 'First start',
		title: 'Create the first organiser',
		lead: 'Organisers sign in to create tournaments, draw rounds and enter scores. Everyone else can view results without an account.',
		hint: 'At least 10 characters. You can add more organisers afterwards.',
		button: 'Create organiser'
	},

	/** Messages the server sends back when it refuses something. */
	problems: {
		signInRequired: 'Sign in as an organiser to do that.',
		badUsername: 'Usernames are 3–32 letters, digits, dots, dashes or underscores.',
		shortPassword: 'Use a password of at least 10 characters.',
		usernameTaken: 'That username is already taken.',
		wrongPassword: 'Your current password is not right.',
		shortNewPassword: 'Use a new password of at least 10 characters.',
		enterName: 'Enter a name.',
		enterNames: 'Enter at least one name.',
		playerExists: 'There is already a player with that name.',
		unknownPlayer: 'Unknown player.',
		unknownMatch: 'Unknown match.',
		tournamentName: 'Give the tournament a name.',
		chooseFormat: 'Choose a format.',
		typeName: 'Type the tournament name exactly to delete it.',
		pickPlayers: 'Tick club players or type new names.',
		playerInRound: 'This player already appears in a round. Mark them as not playing instead.',
		tournamentGone: 'This tournament no longer exists.',
		tournamentFinished: 'This tournament is finished. Reopen it to draw more rounds.',
		notEnoughPlayers: 'Not enough players for a match. Add more players first.',
		noRound: 'There is no round to remove.',
		roundHasResults: 'This round already has results. Clear them first to redraw it.',
		matchNotInTournament: 'That match is not part of this tournament.'
	},

	/** Checks on an entered result. */
	sets: {
		gapBefore: (set: number) => `Set ${set} is filled in but an earlier set is empty.`,
		bothPoints: (set: number) => `Enter both pairs’ points for set ${set} as whole numbers.`,
		none: 'Enter the points of at least one set.',
		tooMany: (bestOf: BestOf) => `This tournament plays best of ${bestOf}.`,
		alreadyDecided: (set: number) => `The match was already decided before set ${set}. Remove the extra set.`,
		level: (set: number) => `Set ${set} can’t end level. Check the points.`,
		enterSet: 'Enter the set’s points.',
		needMore: (need: number, missing: number) => `One pair must win ${need} sets. Add the remaining ${s(missing, 'set', 'sets')}.`
	}
};

export type Messages = typeof en;
export type Problem = keyof Messages['problems'];

const de: Messages = {
	locale: 'de-DE',
	nav: {
		tournaments: 'Turniere',
		players: 'Spieler',
		organisers: 'Organisatoren',
		signOut: 'Abmelden',
		setUp: 'Einrichten',
		signIn: 'Anmelden',
		language: 'Sprache'
	},
	signedInAs: (user) => `angemeldet als ${user}`,
	status: { open: 'Läuft', finished: 'Beendet' },
	removedPlayer: 'Entfernter Spieler',
	noDate: 'Kein Datum',
	field: {
		name: 'Name',
		date: 'Datum',
		courts: 'Felder',
		asManyAsNeeded: 'So viele wie nötig',
		setsPerMatch: 'Sätze pro Spiel',
		format: 'Modus',
		username: 'Benutzername',
		password: 'Passwort'
	},
	cancel: 'Abbrechen',
	bestOf: (n) => (n === 1 ? 'Ein Satz' : `${Math.ceil(n / 2)} Gewinnsätze`),
	bestOfText: (n) => (n === 1 ? 'ein Satz' : `${Math.ceil(n / 2)} Gewinnsätze`),
	formats: {
		random_doubles: {
			name: 'Doppel mit wechselnden Partnern',
			description:
				'Jede Runde lost alle Spieler zu neuen Doppelpaaren aus und vermeidet dabei nach Möglichkeit, dass Partner oder Gegner sich wiederholen. Jeder Spieler bekommt die Punkte seines Paares.'
		}
	},

	home: {
		title: 'Turniere',
		needsSetup: 'Diese Seite hat noch keinen Organisator.',
		setupLink: 'Lege das erste Organisator-Konto an',
		needsSetupEnd: ', um Turniere zu veranstalten.',
		newTournament: 'Neues Turnier',
		namePlaceholder: 'Donnerstags-Training',
		create: 'Anlegen und Spieler hinzufügen',
		emptyTitle: 'Noch keine Turniere',
		emptyAdmin: 'Lege eins an, füge die anwesenden Spieler hinzu und lose die erste Runde aus.',
		emptyViewer: 'Turniere erscheinen hier, sobald ein Organisator eins anlegt.',
		current: 'Aktuell',
		finished: 'Beendet',
		players: 'Spieler',
		rounds: 'Runden',
		scored: 'gespielt'
	},

	tournament: {
		notFound: 'Turnier nicht gefunden',
		allTournaments: 'Alle Turniere',
		rounds: (n) => `${n} ${s(n, 'Runde', 'Runden')}`,
		nPlaying: (n) => `${n} spielen mit`,
		matchesScored: (done, total) => `${done} von ${total} ${s(total, 'Spiel', 'Spielen')} gespielt`,
		sections: 'Turnierbereiche',
		tabRounds: 'Runden',
		tabStandings: 'Tabelle',
		tabLineup: 'Aufstellung',
		round: (n) => `Runde ${n}`,
		needPlayers: (need, have) => `Für eine Runde braucht es mindestens ${need} Spieler (${have} spielen mit).`,
		drawSummary: (playing, courts, sitting) =>
			`${playing} spielen mit · ${courts} ${s(courts, 'Feld', 'Felder')} · ${sitting} ${s(sitting, 'setzt', 'setzen')} aus`,
		matches: 'Spiele',
		change: 'ändern',
		redrawAsk: (n) => `Runde ${n} entfernen, um sie neu auszulosen?`,
		redraw: (n) => `Runde ${n} neu auslosen`,
		draw: (n) => `Runde ${n} auslosen`,
		drawAnyway: (round, open, next) =>
			`In Runde ${round} ${s(open, 'hat', 'haben')} ${open} ${s(open, 'Spiel', 'Spiele')} noch kein Ergebnis. Trotzdem Runde ${next} auslosen?`,
		noRoundsTitle: 'Noch keine Runden',
		noRounds: 'Jede Runde lost alle zu neuen Doppelpaaren aus und vermeidet dabei nach Möglichkeit wiederholte Partner.',
		addPlayers: 'Spieler hinzufügen',
		scoredOf: (done, total) => `${done} von ${total} gespielt`,
		sittingOut: 'Setzen aus:',
		clubPlayers: 'Vereinsspieler',
		selectAll: 'Alle auswählen',
		clear: 'Auswahl aufheben',
		newPlayers: 'Neue Spieler',
		namesPlaceholder: 'Anna, Ben, Chloe…',
		namesHint: 'Namen mit Kommas oder Zeilenumbrüchen trennen. Neue Namen kommen auch in die Vereinsliste.',
		addToTournament: 'Zum Turnier hinzufügen',
		noPlayersTitle: 'Noch keine Spieler',
		noPlayersAdmin: 'Füge alle hinzu, die mitspielen. Für ein Feld braucht es mindestens 4.',
		noPlayersViewer: 'Der Organisator hat noch keine Spieler hinzugefügt.',
		playedCount: (played, byes) => `${played} gespielt${byes ? ` · ${byes}× ausgesetzt` : ''}`,
		active: 'Spielt mit',
		inactive: 'Spielt nicht mit',
		remove: 'Entfernen',
		left: 'Gegangen',
		activeHint:
			'Stelle jemanden auf „Spielt nicht mit“, wenn er früher geht. Die Ergebnisse bleiben erhalten, und er wird nicht mehr ausgelost.',
		settings: 'Turniereinstellungen',
		settingsHint: 'Eine Änderung der Sätze pro Spiel gilt für alle Ergebnisse ab jetzt. Bereits gespeicherte Ergebnisse behalten ihre Sätze.',
		saveSettings: 'Einstellungen speichern',
		saved: 'Gespeichert.',
		finishTitle: 'Turnier beenden',
		reopenTitle: 'Turnier wieder öffnen',
		finishHint: 'Nach dem Beenden werden keine neuen Runden mehr ausgelost. Die Ergebnisse bleiben sichtbar, und das Turnier kann wieder geöffnet werden.',
		reopenHint: 'Wieder öffnen, um weitere Runden auszulosen.',
		markFinished: 'Als beendet markieren',
		reopen: 'Wieder öffnen',
		deleteTitle: 'Turnier löschen',
		deleteHint: 'Löscht alle Runden und Ergebnisse dieses Turniers. Die Spieler bleiben in der Vereinsliste. Das lässt sich nicht rückgängig machen.',
		deleteConfirm: (name) => `Zum Bestätigen „${name}“ eingeben`
	},

	match: {
		court: (n) => `Feld ${n}`,
		done: 'Gespielt',
		todo: 'Offen',
		won: 'Sieg',
		set: (n) => `Satz ${n}`,
		ifNeeded: 'falls nötig',
		pointsFor: (set, team) => `Punkte in Satz ${set} für ${team}`,
		and: 'und',
		save: 'Ergebnis speichern',
		edit: 'Bearbeiten',
		clear: 'Ergebnis löschen',
		clearAsk: 'Dieses Ergebnis löschen? Das Spiel gilt dann wieder als nicht gespielt.',
		finalScore: 'Endstand',
		setsWon: 'Gewonnene Sätze',
		setScores: 'Satzergebnisse',
		waiting: 'Ergebnis steht noch aus'
	},

	standings: {
		emptyTitle: 'Noch keine Ergebnisse',
		empty: 'Die Tabelle füllt sich, sobald das erste Ergebnis gespeichert ist.',
		player: 'Spieler',
		p: 'Sp',
		pTitle: 'Gespielte Spiele',
		w: 'S',
		wTitle: 'Gewonnene Spiele',
		l: 'N',
		lTitle: 'Verlorene Spiele',
		sets: 'Sätze',
		setsTitle: 'Gewonnene – verlorene Sätze',
		pts: 'Pkt',
		ptsTitle: 'Erzielte Punkte in allen Sätzen',
		agst: 'Geg',
		agstTitle: 'Gegenpunkte',
		diffTitle: 'Punktdifferenz',
		hint: 'Sortiert nach gewonnenen Spielen, dann gewonnenen Sätzen, dann erzielten Punkten in allen Sätzen. Wer in allen drei gleichauf liegt, teilt sich den Platz. Jeder Spieler bekommt das Ergebnis seines Paares.'
	},

	players: {
		eyebrow: 'Alle Turniere',
		title: 'Vereinsspieler',
		lead: 'Gesamtbilanz aus allen gespielten Spielen über alle Turniere.',
		addLabel: 'Vereinsspieler hinzufügen',
		add: 'Hinzufügen',
		addHint: 'Mehrere Namen mit Kommas oder Zeilenumbrüchen trennen. Spieler lassen sich auch direkt in einem Turnier hinzufügen.',
		emptyTitle: 'Noch keine Spieler',
		empty: 'Spieler erscheinen hier, sobald sie zum Verein oder zu einem Turnier hinzugefügt werden.',
		player: 'Spieler',
		events: 'Turniere',
		played: 'Spiele',
		won: 'Siege',
		winPct: 'Sieg %',
		sets: 'Sätze',
		archived: 'archiviert',
		newName: 'Neuer Name',
		save: 'Speichern',
		rename: 'Umbenennen',
		archive: 'Archivieren',
		restore: 'Wiederherstellen',
		rankHint: 'Sortiert nach Siegquote über alle Turniere, dann nach gewonnenen Spielen. Punkte stehen in der Tabelle des jeweiligen Turniers.',
		showArchived: (n) => `${n} ${s(n, 'archivierten Spieler', 'archivierte Spieler')} anzeigen`
	},

	admin: {
		eyebrow: 'Zugang',
		title: 'Organisatoren',
		lead: 'Organisatoren können Turniere anlegen, Spieler verwalten, Runden auslosen und Ergebnisse eintragen.',
		added: 'Hinzugefügt',
		you: 'du',
		addTitle: 'Organisator hinzufügen',
		shareHint: 'Gib das Passwort persönlich weiter; es kann nach der Anmeldung geändert werden.',
		addButton: 'Organisator hinzufügen',
		canSignIn: (user) => `${user} kann sich jetzt anmelden.`,
		changeTitle: 'Eigenes Passwort ändern',
		current: 'Aktuelles Passwort',
		next: 'Neues Passwort',
		changeButton: 'Passwort ändern',
		changed: 'Passwort geändert.'
	},

	login: {
		eyebrow: 'Organisatoren',
		title: 'Anmelden',
		lead: 'Nur Organisatoren brauchen ein Konto. Ergebnisse und Tabellen sind für alle sichtbar.',
		button: 'Anmelden',
		tooMany: 'Zu viele Versuche. Bitte 15 Minuten warten und dann erneut versuchen.',
		mismatch: 'Benutzername und Passwort passen nicht zusammen.'
	},

	setup: {
		eyebrow: 'Erster Start',
		title: 'Ersten Organisator anlegen',
		lead: 'Organisatoren melden sich an, um Turniere anzulegen, Runden auszulosen und Ergebnisse einzutragen. Alle anderen sehen die Ergebnisse ohne Konto.',
		hint: 'Mindestens 10 Zeichen. Weitere Organisatoren lassen sich danach hinzufügen.',
		button: 'Organisator anlegen'
	},

	problems: {
		signInRequired: 'Dafür musst du als Organisator angemeldet sein.',
		badUsername: 'Benutzernamen bestehen aus 3–32 Buchstaben, Ziffern, Punkten, Binde- oder Unterstrichen.',
		shortPassword: 'Das Passwort muss mindestens 10 Zeichen haben.',
		usernameTaken: 'Dieser Benutzername ist schon vergeben.',
		wrongPassword: 'Das aktuelle Passwort stimmt nicht.',
		shortNewPassword: 'Das neue Passwort muss mindestens 10 Zeichen haben.',
		enterName: 'Bitte einen Namen eingeben.',
		enterNames: 'Bitte mindestens einen Namen eingeben.',
		playerExists: 'Es gibt schon einen Spieler mit diesem Namen.',
		unknownPlayer: 'Unbekannter Spieler.',
		unknownMatch: 'Unbekanntes Spiel.',
		tournamentName: 'Bitte dem Turnier einen Namen geben.',
		chooseFormat: 'Bitte einen Modus wählen.',
		typeName: 'Zum Löschen den Turniernamen genau eingeben.',
		pickPlayers: 'Vereinsspieler ankreuzen oder neue Namen eingeben.',
		playerInRound: 'Dieser Spieler ist schon in einer Runde. Stelle ihn stattdessen auf „Spielt nicht mit“.',
		tournamentGone: 'Dieses Turnier gibt es nicht mehr.',
		tournamentFinished: 'Dieses Turnier ist beendet. Öffne es wieder, um weitere Runden auszulosen.',
		notEnoughPlayers: 'Nicht genug Spieler für ein Spiel. Füge zuerst weitere Spieler hinzu.',
		noRound: 'Es gibt keine Runde zum Entfernen.',
		roundHasResults: 'Diese Runde hat schon Ergebnisse. Lösche sie zuerst, um neu auszulosen.',
		matchNotInTournament: 'Dieses Spiel gehört nicht zu diesem Turnier.'
	},

	sets: {
		gapBefore: (set) => `Satz ${set} ist ausgefüllt, aber ein früherer Satz ist leer.`,
		bothPoints: (set) => `Bitte für Satz ${set} die Punkte beider Paare als ganze Zahlen eingeben.`,
		none: 'Bitte die Punkte von mindestens einem Satz eingeben.',
		tooMany: (bestOf) =>
			bestOf === 1 ? 'In diesem Turnier wird nur ein Satz gespielt.' : `In diesem Turnier wird auf ${Math.ceil(bestOf / 2)} Gewinnsätze gespielt.`,
		alreadyDecided: (set) => `Das Spiel war schon vor Satz ${set} entschieden. Bitte den überzähligen Satz entfernen.`,
		level: (set) => `Satz ${set} kann nicht unentschieden enden. Bitte die Punkte prüfen.`,
		enterSet: 'Bitte die Punkte des Satzes eingeben.',
		needMore: (need, missing) => `Ein Paar muss ${need} Sätze gewinnen. Bitte ${s(missing, 'den fehlenden Satz', 'die fehlenden Sätze')} ergänzen.`
	}
};

export const msgs = (lang: Lang): Messages => (lang === 'de' ? de : en);

/** The visitor's language from the browser's preferences: German if it comes before English, else English. */
export function pickLang(acceptLanguage: string | null): Lang {
	for (const part of (acceptLanguage ?? '').split(',')) {
		const tag = part.split(';')[0].trim().toLowerCase();
		if (tag.startsWith('de')) return 'de';
		if (tag.startsWith('en')) return 'en';
	}
	return 'en';
}
