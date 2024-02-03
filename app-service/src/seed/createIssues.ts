import dbClient from "../utils/prisma.js";
import issuesToSubjectsMap from "./data/issuesToSubjectsMap.json" assert { type: "json" };

const issueSubjectMap = issuesToSubjectsMap as {
  [key: string]: string[];
};
const createIssues = async () => {
  let issues = [];

  for (const issueTitle of Object.keys(issuesToSubjectsMap)) {
    const subjects = issueSubjectMap[issueTitle];
    const issue = {
      name: issueTitle,
      subjects,
    };
    issues.push(issue);
  }
  await dbClient.$transaction(
    issues.map((baseIssue) =>
      dbClient.issue.upsert({
        where: { name: baseIssue.name },
        create: { name: baseIssue.name, subjects: baseIssue.subjects },
        update: { name: baseIssue.name, subjects: baseIssue.subjects },
      })
    )
  );
};

await createIssues();

process.exit(0);
