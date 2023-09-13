const core = require("@actions/core");
const github = require("@actions/github");

const main = async () => {
  try {
    const token = core.getInput("github-token", { required: true });
    const owner = core.getInput("owner", { required: true });
    const repo = core.getInput("repo", { required: true }).split("/")[1];
    const head = core.getInput("head", { required: true });
    const base = core.getInput("base", { required: true });

    const octokit = new github.getOctokit(token);

    const { data: comparison } = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });

    const uniqueCommits = comparison.commits.map(commit => commit.sha);

    const pullRequestsPromises = uniqueCommits.map(commitSha =>
      octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: commitSha,
      }).catch(error => {
        console.error(`Error fetching PR for commit ${commitSha}:`, error.message);
        return null;
      })
    );

    const pullRequestsResponses = await Promise.all(pullRequestsPromises);

    const pullRequests = pullRequestsResponses.reduce((acc, response) => {
      if (response && response.data.length > 0) {
        acc.push(response.data[0]); // Assuming each commit is associated with at most one pull request
      }
      return acc;
    }, []);

    core.setOutput("pull-requests", JSON.stringify(pullRequests));
  } catch (error) {
    console.log("error");
    core.setFailed(error.message);
  }
};

main();
