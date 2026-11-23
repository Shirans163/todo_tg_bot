type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const port = Number(process.env.ENDPOINTS_PORT);

// body fetch builder
async function bodyFetchBuilder(path: string, method: HttpMethod, body: Record<string, string | number | boolean | null>) {

    const res = await fetch(`http://localhost:${port}${path}`, {
        method: method,
        headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_SECRET}`
        },
        body: JSON.stringify(body) 
    });

    const resObj = await res.json();

    if (!res.ok) {
        throw new Error(resObj?.message ?? `HTTP error ${res.status}`);
    };

    return resObj;
};

// no-body fetch builer
async function noBodyFetchBuilder(path: string, method: HttpMethod) {

    const res = await fetch(`http://localhost:${port}${path}`, {
        method: method,
        headers: { 'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_SECRET}`
        }
    });

    const resObj = await res.json();

    if (!res.ok) {
        throw new Error(resObj?.message ?? `HTTP error ${res.status}`);
    };

    return resObj;
};

export {
    bodyFetchBuilder,
    noBodyFetchBuilder,
};