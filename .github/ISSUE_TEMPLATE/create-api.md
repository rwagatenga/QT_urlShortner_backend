---
name: 'API: Creating a new endpoint'
about: Issue to use when proposing new API endpoint to be created
title: ''
labels: ''
assignees: ''
---

## Overview

The goal of this issue is to create a new API endpoint at `/api/...` in the hooks project. To create this API, create a new file
at `@engine/hooks/src/pages/api` with file called `...ts`.

## Proposed Spec

The API endpoint should support `GET` + `POST` request. It should take the following parameters as a query parameter as a GET query, and JSON body as a post request:

```
{
  "...": "..."
}
```

And response should have the following structure:

```
{
  "success": true,
  "result": {
    "...": "..."
  }
}
```

On error, the response should become as follows:

```
{
  "success": false,
  "error": { ... },
  "stack": ...
}
```

## Proposed work

1. Create the API endpoint
2. Ensure that it validates and only continues if the request data format is correct
3. Ensure that the response is properly

## Acceptance Criteria

1. Ensure that it validates and only continues if the request data format is correct
2. Ensure that the response is properly sent on the success case
3. Ensure that it returns proper errors on error case, with optional "stack" to debug un-expected errors
4. Ensure that it works properly with Sentry to log any errors.
5. Ensure that there is a basic end to end test to make sure the API endpoint is operational

## Resources

1. You can learn more about APIs in NextJS here: https://nextjs.org/docs/api-routes/introduction
2. Make sure to read exising API design done in `@engine/hooks/src/pages/api/healthz.ts`
3. Ensure to read how APIs are tested, by reading some examples here: `@engine/hooks/src/__tests__/api/contractSyncer.test.ts`
