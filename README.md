Mobile Phone Prefix and International Prefix Extractor!
=======================================================

( still better than MPPaIPE =) )

# You lazy boy...

File `out.json` contains what you need.

# Extractor

Ectract from wikipedia all required data.

```
npm run extractor
```

Please check script command into `package.json`

```
http://en.wikipedia.org/wiki/List_of_mobile_phone_number_series_by_country
```

## Limits.. READ THIS!

NSN and CARRIER aren't always correct! Both require some work. I have to count rowSpan on each tr and keep track of which 
row I'm reading and not only on cellCount as I'm doing.

I'll fix, but not now, we don't need those fields, for now.

## Dictionary

- NSN: National Significant Number, i.e. the number of digits after the country code excluding any trunk code or access code.

# Cache

First time you run this extractor, the page got from wikipedia, wil be stored into `cache.html`.

You can rename `working_cache.html` into `cache.html` if for some reason, the page got from wikipedia, fails parsing.