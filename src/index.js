const core = require("@actions/core");
const github = require("@actions/github");
const Bottleneck = require("bottleneck"); // Assuming Bottleneck is installed as a dependency

const limiter = new Bottleneck({
  minTime: 1000, // Minimum time between API requests (adjust as needed)
  maxConcurrent: 5, // Maximum number of concurrent API requests (adjust as needed)
});

const main = async () => {
  try {
    const token = core.getInput("github-token", { required: true });
    const owner = core.getInput("owner", { required: true });
    const repo = core.getInput("repo", { required: true }).split("/")[1];
    const head = core.getInput("head", { required: true });
    const base = core.getInput("base", { required: true });
    const prNumber = core.getInput("pr-number", { required: true });

    const octokit = new github.getOctokit(token);

    const { data: comparison } = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });

    const uniqueCommits = comparison.commits.map(commit => commit.sha);

    const processedPRs = new Set();

    const pullRequestsPromises = uniqueCommits.map(commitSha =>
      limiter.schedule(() => octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: commitSha,
      }).catch(error => {
        console.error(`Error fetching PR for commit ${commitSha}:`, error.message);
        return null;
      }))
    );

    const pullRequestsResponses = await Promise.all(pullRequestsPromises);

    const pullRequests = pullRequestsResponses.reduce((acc, response) => {
      if (response && response.data.length > 0) {
        const { number, body } = response.data[0];
        if (!processedPRs.has(number)) {
          const regex = /\[.*?\]\(https:\/\/trello\.com\/c\/.*?\)/;
          const match = body.match(regex);
          acc.push(`- #${number}` + (match ? ` (Issue: ${match[0]})` : ''));
          processedPRs.add(number)
        }
      }
      return acc;
    }, []);

    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const updatedDescription = pullRequest.body ? pullRequest.body : '' + '\r\n' + pullRequests.join('\r\n');

    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      body: updatedDescription,
    });

    core.setOutput("pull-requests", pullRequests.join('\r\n'));
  } catch (error) {
    console.log("error");
    core.setFailed(error.message);
  }
};

main();
