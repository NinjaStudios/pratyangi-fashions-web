# Commands guide (plain English)

This page explains every command used in this project: what it does, when to use it, and what you should see.
You do not need to be a developer to follow it. Copy a command exactly as written and press Enter.

## Before you start: where to type commands

Commands are typed in a **terminal**. In VS Code or Cursor, open the menu **Terminal → New Terminal**.
The terminal must be inside the project's top folder, the one that contains the files `package.json` and the folder `apps`.
To check, type `dir` (Windows) or `ls` (Mac/Linux). You should see `apps`, `docs` and `package.json` in the list.

To move into the folder, type `cd` followed by its path, for example:

```
cd C:\Users\YourName\Downloads\pratyangi-fashions-web
```

**To stop a command that keeps running** (like the website server), click the terminal and press **Ctrl + C**.

---

## 1. First-time setup (once per computer)

| Step | Command | What it does |
| --- | --- | --- |
| 1 | Install Node.js from <https://nodejs.org> (version 20.9 or newer) | Node.js is the engine that runs the project's tools. Check it worked with `node -v`; it should print a version number. |
| 2 | `npm install -g pnpm@10` | Installs **pnpm**, the tool that downloads and manages the project's packages. `-g` means "for the whole computer". Check with `pnpm -v`. |
| 3 | `git clone https://github.com/NinjaStudios/pratyangi-fashions-web.git` | Downloads a copy of the project from GitHub into a new folder. |
| 4 | `cd pratyangi-fashions-web` | Moves the terminal into that folder. |
| 5 | `pnpm install` | Downloads every package the project needs into a folder called `node_modules`. Takes about a minute the first time. |
| 6 | `pnpm --filter pratyangi-web exec playwright install chromium` | Downloads the special browser used by the automated tests. Only needed if you will run tests. |

Run `pnpm install` again whenever you download new changes from GitHub, or if you see "module not found".

**What do the odd words mean?**
`--filter pratyangi-web` means "do this inside the website part of the project only".
`exec` means "run a tool that is installed in the project".

---

## 2. Everyday commands

Run these from the project's top folder.

| Command | What it does | When to use it | What you should see |
| --- | --- | --- | --- |
| `pnpm dev` | Starts a **working copy of the website on your computer** at <http://localhost:3000>. Open that address in your browser. Edit a file and the page updates by itself. | While building or changing the website. | A line saying "Ready" and the address. Keep the terminal open. Stop with Ctrl + C. |
| `pnpm typecheck` | **Reads all the code looking for mistakes** without running the site. | Before saving your work to Git. | Nothing but the command lines means no problems. Errors are listed with the file and line. |
| `pnpm build` | **Creates the finished website** (plain files) in `apps/web/out`. This is what goes live. | Before a release, or to check nothing is broken. | A list of pages with a ○ beside each, and "Compiled successfully". A red error means something needs fixing. |
| `pnpm preview` | Shows the **finished website** from `apps/web/out` at <http://localhost:3000>. | To see exactly what visitors will get. Run `pnpm build` first. | "Accepting connections" and the address. Stop with Ctrl + C. |

`pnpm dev` and `pnpm preview` both use port 3000, so run only one at a time.

---

## 3. Automated tests (Playwright)

The tests are a robot that opens the website in a real browser, clicks around like a visitor, and checks that
everything works. It does this twice: once at desktop size and once at phone size.

| Command | What it does | What you should see |
| --- | --- | --- |
| `pnpm test` | **Builds the website, then runs all the tests.** Takes about a minute. The browser runs invisibly. | A list of lines starting with `ok`, ending in **`42 passed`**. A failed test shows a red `x` and says what went wrong. |
| `pnpm test:headed` | The same tests, but **in a visible browser window** so you can watch the robot work. | A Chrome window opens and moves by itself, then closes. |
| `pnpm test:ui` | Opens **Playwright's viewer**: a window listing every test. Click a test to run it, then step back and forward to see the page at each step. | A window with a test list on the left and the page on the right. Close the window to finish. |
| `pnpm --filter pratyangi-web run test:e2e:report` | Opens the **report of the last test run** in your browser. | A web page listing each test. A failed test has a screenshot and a video. Press Ctrl + C in the terminal to close it. |

Extra options (these skip the rebuild, so run `pnpm build` or `pnpm test` first):

| Command | What it does |
| --- | --- |
| `pnpm --filter pratyangi-web exec playwright test` | Runs all tests again without rebuilding (faster). |
| `pnpm --filter pratyangi-web exec playwright test hero-scroll` | Runs only the tests in the file whose name contains `hero-scroll`. The test files are in `apps/web/e2e`. |
| `pnpm --filter pratyangi-web exec playwright test --project=mobile` | Runs only the phone-size tests. Use `--project=desktop` for desktop only. |

**What the tests check:** every page loads with the right title, no broken pictures, no errors and no sideways scrolling;
the Shop menu and search box work with the keyboard; "Add to cart" raises the bag count; the category carousel
moves and stops cleanly at both ends; the hero picture stays in place while Shop by Category slides over it.

**If a test fails:** open the report (command above) and look at the screenshot. Fix the problem, or, if you changed
the design on purpose, update the test in `apps/web/e2e`. Failure screenshots and videos are also saved in
`apps/web/test-results`.

---

## 4. Saving and sharing your work with Git

Git keeps the history of the project. GitHub is the website where the shared copy lives. **Never work directly on the
`main` branch**: make a branch, save your work, and ask for it to be merged through a pull request.

| Command | What it does |
| --- | --- |
| `git status` | Shows which files you have changed. Run it any time to see where you are. |
| `git pull` | Downloads the latest changes from GitHub into your copy. Do this on `main` before starting new work. |
| `git checkout -b ui/short-name` | Creates a new **branch** (a safe separate copy to work in) named `ui/short-name` and switches to it. Use a short description, for example `ui/footer-links`. |
| `git add -A` | Marks all your changes to be saved. |
| `git commit -m "Describe what you changed"` | Saves a snapshot of the marked changes on your computer, with your message. |
| `git push -u origin ui/short-name` | Uploads your branch to GitHub. The `-u` is only needed the first time for each branch; after that `git push` is enough. |
| `git log --oneline` | Lists recent saved snapshots, newest first. Press `q` to leave the list. |

**The usual routine:**

1. `git checkout main` then `git pull`: get the latest version.
2. `git checkout -b ui/short-name`: start a branch.
3. Make your changes. Check them with `pnpm dev`.
4. `pnpm typecheck` and `pnpm test`: make sure nothing broke.
5. `git add -A`, then `git commit -m "..."`, then `git push -u origin ui/short-name`.
6. Open this address in your browser (replace `ui/short-name` with your branch name), click **Create pull request**,
   and ask someone to review and merge it:
   `https://github.com/NinjaStudios/pratyangi-fashions-web/compare/main...ui/short-name`
7. After it is merged: `git checkout main`, `git pull`, and `git branch -d ui/short-name` to tidy up.

**Never save passwords, keys or `.env` files** with `git add`. They are ignored automatically, but double-check
`git status` before every commit.

---

## 5. The live website (Vercel)

The website is hosted on Vercel at <https://pratyangi-fashions-web.vercel.app>.
**You normally do not need any commands:** when a pull request is merged into `main`, Vercel publishes the new
version by itself in under a minute. Every other branch gets its own private preview.

These commands are optional and need the Vercel command-line tool:

| Command | What it does |
| --- | --- |
| `npm install --global vercel@latest` | Installs the Vercel tool (once per computer). |
| `vercel login` | Signs in. It prints a link; open it in your browser and approve. Never type your password into the terminal. |
| `vercel whoami` | Shows which Vercel account you are signed in as. |
| `vercel ls pratyangi-fashions-web` | Lists recent deployments and whether each is Ready or has an Error. |
| `vercel inspect <deployment-address> --logs` | Shows the build log of one deployment, useful when a deployment failed. |
| `vercel redeploy <deployment-address>` | Runs a deployment again, for example after fixing a setting in the Vercel dashboard. |

If a deployment fails with "Root Directory ... does not exist", open the project in the Vercel dashboard →
Settings → General and set **Root Directory** to `apps/web`.

---

## 6. Common problems

| What you see | What to do |
| --- | --- |
| `pnpm: command not found` | Do step 2 of the first-time setup. Close and reopen the terminal afterwards. |
| `Use pnpm instead` | You typed `npm install`. Use `pnpm install` instead. |
| "Module not found" or missing packages | Run `pnpm install`. |
| `Port 3000 is already in use` | Another copy is running. Click its terminal and press Ctrl + C, or use another port: `pnpm --filter pratyangi-web exec next dev --port 3001`. |
| Strange errors after moving or deleting files | Delete the folder `apps/web/.next` and run the command again. |
| Tests say the browser is missing | Run the playwright install command from step 6 of the first-time setup. |
| A folder cannot be renamed or deleted on Windows | Close editors and terminals that have it open, then try again. |
| `git push` says permission denied | Your GitHub account does not have access to the repository. Ask a repository owner to add you as a collaborator. |

---

## 7. Quick "I want to…" list

| I want to… | Run |
| --- | --- |
| See the website while I work | `pnpm dev` |
| Check my code for mistakes | `pnpm typecheck` |
| Check everything still works | `pnpm test` |
| Watch the robot test the site | `pnpm test:headed` |
| See what visitors will get | `pnpm build` then `pnpm preview` |
| Save and share my work | `git add -A`, `git commit -m "..."`, `git push -u origin <branch>` |
| Get the newest version | `git checkout main` then `git pull` then `pnpm install` |
