require('dotenv').config()

const { getLeetCodeStats } = require('./leetcode')
const { Octokit } = require('@octokit/rest')

const {
    GH_TOKEN: github_token,
    GIST_ID: gist_id
} = process.env

const octokit = new Octokit({
    auth: `token ${github_token}`
})

async function main() {
    const leetcode = await getLeetCodeStats()
    await updateLeetCodeGist(leetcode)
}

async function updateLeetCodeGist(leetcode) {
    let gist
    try {
        gist = await octokit.gists.get({
            gist_id
        })
    } catch (error) {
        console.error(
            `leetcode-box cannot resolve your gist:\n${error}`
        )
    }

    const lines = []

    const title = [
        "Difficulty".padEnd(10),
        "Solved".padEnd(9),
        "Accepted Rate".padEnd(8)
    ]
    lines.push(title.join(" "))

    for (let i = 0; i < leetcode.solved.length; i++) {
        const difficulty = leetcode.solved[i].difficulty
        const acceptedRate = leetcode.solved[i].acceptedRate
        const solvedRadio = leetcode.solved[i].solvedRadio

        const line = [
            difficulty.padEnd(10),
            solvedRadio.padEnd(9),
            generateBarChart(acceptedRate, 20),
            String(acceptedRate.toFixed(1)).padStart(5) + "%"
        ]
        lines.push(line.join(" "))
    }


    try {
        const filename = Object.keys(gist.data.files)[0]
        await octokit.gists.update({
            gist_id: gist_id,
            files: {
                [filename]: {
                    filename: `💻 My LeetCode Stats...`,
                    content: lines.join("\n")
                }
            }
        })
    } catch (error) {
        console.error(`Unable to update gist\n${error}`)
    }

}

function generateBarChart(percent, size) {
    const clamped = Math.max(0, Math.min(percent, 100));
    const filled = Math.round((clamped / 100) * size);
    const empty = size - filled;

    return (
        "█".repeat(filled) +
        "░".repeat(empty)
    );
}

(async() => {
    await main()
})()
