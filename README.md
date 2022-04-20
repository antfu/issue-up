<p align="center">
<img src="https://user-images.githubusercontent.com/11247099/164195291-4dd1b6df-cc89-4dbb-97a2-274fcccd86ce.png" height="120">
</p>
<h1 align="center">IssueUp</h1>

<p align="center">
Mirror issues to the upstream repos
<br>
<br>
<a href="https://github.com/apps/upissues"><b>Install</b></a>
</p>

<br>

## Setup

- Install the [IssueUp App](https://github.com/apps/upissues) for your repos / orgs
- Add `.github/issue-up.yml` to the repo you want to enable UpIssues

```yaml
upstream:
  dep-a: antfu/dep-a
  dep-b: antfu/dep-b
```

In the `upstream` field, the key represents the name of tag to trigger the action and the value represents the name of the upstream repo (currently only supports repos on GitHub).

> 💡 To avoid spamming the upstream repos, we recommend to setup UpIssues **only when you controls both repos**. And it's recommended to not include that trigger labels in issue templates but only assign them manually.

## Usage

With the previous config for example, when you label an issue with `upstream` and `dep-a`:

<img width="211" alt="image" src="https://user-images.githubusercontent.com/11247099/164196425-79e85568-b196-478b-a0ba-f4044199e56d.png">

A mirrored issue will be created in the `antfu/dep-a` repository:

<img width="652" alt="image" src="https://user-images.githubusercontent.com/11247099/164196790-d0ecea63-413a-443b-9f65-1344adb8f445.png">

With that, the two issues are linked together. Closing one of them will close the other one.
