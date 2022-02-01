## Candy Machine with sacrifices

This repo contains the modified metaplex contracts for creating a candy machine that accepts other NFT's as sacrifices instead of SOL and adds them to the treasury. It also contains the modified cli tool and mint-ui react app.
Uses the same config as the default candy machine, with minor diferences:

```
"acceptsSacrifices":true,
"sacrificedTokenSymbol":"LDTG1",
"endSettings": {
  "endSettingType":{
    "amount":true
  },
  "value":0
}
```

The user must specify the sacrificed token symbol, as well as endSettings.value = 0 to prevent bypassing the sacrifice check by using the classic candy machine contract.
