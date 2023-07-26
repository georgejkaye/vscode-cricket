export interface Bowled {
    type: "b"
    bowler: string
}

const bowledRegex = /([†A-z ]*) b ([†A-z ]*) ([0-9]*)/;

export interface Caught {
    type: "c"
    bowler: string
    fielder: string
}

const caughtRegex = /([†A-z ]*) c ([†A-z ]*) b ([†A-z ]*) ([0-9]*)/;

export interface CaughtAndBowled {
    type: "cb"
    bowler: string
}

const caughtAndBowledRegex = /([†A-z ]*) c & b ([†A-z ]*) ([0-9]*)/;

export interface Lbw {
    type: "lbw"
    bowler: string
}

const lbwRegex = /([†A-z ]*) lbw b ([†A-z ]*) ([0-9]*)/;

export interface RunOut {
    type: "ro"
    fielder: string
}

const runOutRegex = /([†A-z ]*) run out \(([†A-z ]*)\) ([0-9]*)/;

export interface Stumped {
    type: "st"
    bowler: string
    fielder: string
}

const stumpedRegex = /([†A-z ]*) st ([†A-z ]*) b ([†A-z ]*) ([0-9]*)/;

export interface HitWicket {
    type: "hw"
    bowler: string
}

const hitWicketRegex = /([†A-z ]*) hit wicket ([†A-z ]*) b ([†A-z ]*) ([0-9]*)/;

export interface Retired {
    type: "ret"
}

const retriedRegex = /([†A-z ]*) retired ([0-9]*)/;

export interface Dismissal {
    dismissal: Bowled | Caught | CaughtAndBowled | Lbw | RunOut | Stumped | HitWicket | Retired
    batter: string
    runs: number
    balls: number
    fours: number
    sixes: number
    minutes? : number
    strikeRate: number
}

const statsRegex = /\(([0-9]*)b ([0-9]*)x4 ([0-9]*)x6(?: ([0-9]*)m)?\) SR: ([0-9\.]*)/;

export const getDismissalString = (dis : Dismissal) => {
    let dismissal = dis.dismissal;
    let dismissalText =
        dismissal.type === "b" ? `b ${dismissal.bowler}` :
        dismissal.type === "c" ? `c ${dismissal.fielder} b ${dismissal.bowler}` :
        dismissal.type === "cb" ? `c and b ${dismissal.bowler}` :
        dismissal.type === "lbw" ? `lbw b ${dismissal.bowler}` :
        dismissal.type === "ro" ? `run out (${dismissal.fielder})` :
        dismissal.type === "st" ? `st ${dismissal.fielder} b ${dismissal.bowler}` :
        dismissal.type === "hw" ? `hit wicket b ${dismissal.bowler}` :
        dismissal.type === "ret" ? `retired` : "";
    return `${dis.batter} ${dismissalText}`;
}

export const parseDismissal = (dis : string) => {
    let bowled = dis.match(bowledRegex);
    let caught = dis.match(caughtRegex);
    let caughtAndBowled = dis.match(caughtAndBowledRegex);
    let lbw = dis.match(lbwRegex);
    let runOut = dis.match(runOutRegex);
    let stumped = dis.match(stumpedRegex);
    let hitWicket = dis.match(hitWicketRegex);
    let retired = dis.match(retriedRegex);
    let batterAndDismissal : any =
        bowled ? [ bowled[1], { type: "b", bowler: bowled[2]}] :
        caught ? [ caught[1], { type: "c", fielder: caught[2], bowler: caught[3] }] :
        caughtAndBowled ? [ caughtAndBowled[1], { type: "cb", bowler: caughtAndBowled[2] }] :
        lbw ? [ lbw[1], { type: "lbw", bowler: lbw[2] }] :
        runOut ? [ runOut[1], { type: "ro", bowler: runOut[2] }] :
        stumped ? [ stumped[1], { type: "st", fielder : stumped[2], bowler: stumped[3] }] :
        hitWicket ? [ hitWicket[1], { type: "hw", bowler: hitWicket[2]}] :
        retired ? [ retired[1], { type: "ret" }] : {};
    let stats = dis.match(statsRegex);
    if(stats) {
        return <Dismissal>{
            dismissal: batterAndDismissal[1],
            batter: batterAndDismissal[0],
            runs: parseInt(stats[0]),
            balls: parseInt(stats[1]),
            fours: parseInt(stats[2]),
            sixes: parseInt(stats[3]),
            minutes: parseInt(stats[4]),
            strikeRate: parseInt(stats[5])
        };
    }
    return undefined;
}