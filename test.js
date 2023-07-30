const fetch = require("node-fetch");

(async () => {
  let authorizedRequests = 0;

  while (true) {
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(chargeRedis());
    }

    let responses = await Promise.all(promises);
    responses = processResponses(responses);
    authorizedRequests += responses.filter((res) => res.isAuthorized).length;

    console.log(responses);

    const lastRequestFound =
      responses.findIndex(
        (res) => res.remainingBalance <= 0 && !res.isAuthorized
      ) > -1;

    if (lastRequestFound) break;
  }

  if (authorizedRequests === 20) {
    console.log("PASS!", authorizedRequests);
  } else {
    console.log("FAIL!", authorizedRequests);
  }

  await resetRedis();
})();

async function chargeRedis() {
  const response = await fetch(
    "https://undyinmzv9.execute-api.us-east-1.amazonaws.com/prod/charge-request-redis",
    {
      method: "POST",
      body: JSON.stringify({
        serviceType: "voice",
        unit: 2,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.json();
}

async function resetRedis() {
  await fetch(
    "https://undyinmzv9.execute-api.us-east-1.amazonaws.com/prod/reset-redis",
    {
      method: "POST",
    }
  );
}

function processResponses(responses) {
  responses = responses.filter((res) => !res.message);
  responses.sort((a, b) => {
    if (a.remainingBalance === b.remainingBalance) {
      return b.charges - a.charges;
    }
    return b.remainingBalance - a.remainingBalance;
  });
  return responses;
}
