# Putting Maison & Jardin online

This takes about 20 minutes. You need two free accounts:

- **Supabase** keeps members' accounts and rooms (the database).
- **Vercel** runs the website and gives you the link.

You don't need to install anything on your computer. Everything happens in your web browser.

---

## Part 1: Supabase (the database)

1. Go to **supabase.com** and choose **Start your project**. Sign up with your GitHub account
   (the same one that holds `my-project`).
2. Choose **New project**.
   - **Name:** `maison-jardin`
   - **Database password:** choose **Generate a password**, then **copy it and keep it somewhere safe**.
     You will need it in a moment.
   - **Region:** pick the one closest to where most of your clients live, for example *West Europe (London)*.
     Remember which one you chose.
   - Choose **Create new project** and wait a minute or two while it is prepared.
3. When it's ready, press the **Connect** button at the top of the project page.
4. Find the connection string labelled **Transaction pooler**. It looks like this:

   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
   ```

5. Copy it, and replace `[YOUR-PASSWORD]` (including the square brackets) with the database
   password from step 2. This whole line is your **DATABASE_URL**. Keep it private, because
   anyone with it can read your database.

You don't need to create any tables: the app sets them up itself the first time it runs.

---

## Part 2: Vercel (the website)

1. Go to **vercel.com** and choose **Sign Up**. Pick **Hobby** (free) and sign up with GitHub.
2. Choose **Add New… → Project**, find **my-project** in the list and choose **Import**.
   If it isn't listed, choose **Adjust GitHub App Permissions** and allow Vercel to see `my-project`.
3. Before pressing Deploy, open **Environment Variables** and add these two:

   | Name             | Value |
   | ---------------- | ----- |
   | `DATABASE_URL`   | the line you made in Part 1, step 5 |
   | `SESSION_SECRET` | a long random string of at least 32 letters and numbers, used to keep sign-ins secure. A password manager's "generate password" button is ideal. Never share it. |

4. Choose **Deploy**. After a minute or two Vercel shows **Congratulations** and your link, something like
   `https://my-project-abc123.vercel.app`. **That is your app.**

### Which version of the code goes online?

Vercel publishes the **main** branch of your repository. The app is currently on the branch
`claude/admiring-wright-nsqt4f`, so do one of these first:

- **Easiest:** ask Claude to open a pull request and merge it into `main` (Claude can do this for you),
  **or**
- in Vercel, go to **Settings → Git → Production Branch**, type `claude/admiring-wright-nsqt4f`,
  save, then go to **Deployments** and choose **Redeploy**.

### Optional: make the region match

For a faster site, put the website next to the database: in Vercel go to
**Settings → Functions → Function Region** and choose the same area as your Supabase region
(for example *London, United Kingdom*), then redeploy.

---

## After it's online

- Every time new work is merged into `main`, Vercel updates the site automatically.
- To give the app your own address (for example `maisonetjardin.com`), buy the name from any domain
  seller, then add it in Vercel under **Settings → Domains**.
- In Supabase, **Table Editor** shows your members (`users`) and their rooms (`rooms`).
  Passwords are never stored, only a secure scrambled version of them.

## If something goes wrong

| What you see | What to do |
| ------------ | ---------- |
| The build fails in Vercel | Copy the red error lines and send them to Claude. |
| "Application error" when signing up | Check that `DATABASE_URL` is set, that you replaced `[YOUR-PASSWORD]`, and that you used the **Transaction pooler** line (port `6543`). Then redeploy. |
| Sign-in doesn't stay signed in | Check that `SESSION_SECRET` is set and at least 32 characters, then redeploy. |
