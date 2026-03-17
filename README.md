# SystemLink Health Check

A self-test web application for SystemLink that checks all API services are responding correctly.

## Services Tested

- User / Auth
- Workspaces
- Tags & Tag Subscriptions
- Test Monitor (Results, Steps, Products)
- Asset Management
- Systems Management
- File Service
- Notebook Execution
- Feeds
- Work Items & Work Item Templates
- Dashboards
- Alarm Rules
- Data Spaces
- Spec Compliance

## Development

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Deploy to SystemLink

```bash
ng build && cd dist/clientapp/browser && slcli webapp publish . -w <workspace>
```

## Package

```bash
ng build && slcli webapp pack dist/clientapp/browser/ --output systemlink-health-check.nipkg
```
