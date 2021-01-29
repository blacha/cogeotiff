## Fetchable

Lazyly load data remotely


```typescript

import {Fetchable} from '@cogeotiff/fetchable';


const fetched = new Fetchable<string>(() => fetch('https://google.com').then(r => r.text()))

fetched.isFetching // False

fetched.value // null
fetched.error // null

/** Trigger a fetch operation */
const value  = await fetched.fetch();
/** Since it has already fetched, returns the cached result */
const valueB = await fetched.fetch(); 

// Clear the internal cache and refetch the data
fetched.refetch();
```


