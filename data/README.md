# VAWT Data

Treat this directory as read only unless explicitly instructed.

- BRACKET.md is raw data about the bracket planning
- TOURNAMENT_NOTES.md is raw scratch data, ignore this
- distillery-data.json is structured data about the distilleries
- tournament-data.json is structured data about this specific tournament

## distillery-data.json Schema

Example:

```json
{
    "name": "Open Road",
    "officialName": "Open Road Distilling Co.",
    "website": "https://openroaddistillingco.com/",
    "instagram": "https://www.instagram.com/openroaddistillingco/",
    "facebook": "https://www.facebook.com/OpenRoadDistillingCo/",
    "locations": [
      "1871 Fountain Dr., Ste. 100, Reston, VA 20190"
    ],
    "description": "",
    "products": [
      {
        "name": "Bourbon Whiskey",
        "type": "bourbon",
        "link": ""
      },
      {
        "name": "Rye Whiskey",
        "type": "rye",
        "link": ""
      },
      {
        "name": "Vodka",
        "type": "vodka",
        "link": ""
      },
      {
        "name": "Gin",
        "type": "gin",
        "link": ""
      },
      {
        "name": "Moonshine",
        "type": "moonshine",
        "link": ""
      },
      {
        "name": "American Single Malt",
        "type": "asmw",
        "link": ""
      },
      {
        "name": "American Whiskey",
        "type": "other whiskey",
        "link": ""
      },
      {
        "name": "Blueberry Vodka",
        "type": "other",
        "link": ""
      }
    ]
  },
```

Product type must be one of the following:

```json
[
  "bourbon",
  "rye",
  "asmw",
  "other whiskey",
  "moonshine",
  "vodka",
  "gin",
  "rum",
  "brandy",
  "agave",
  "liqueur",
  "other"
]
```
