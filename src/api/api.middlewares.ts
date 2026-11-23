import type { NextFunction, RequestHandler, Response, Request } from 'express';
import crypto from 'node:crypto';

type listValidationRules =
    | {
        type: 'string';
        maxLength: number;
        mayBeNull?: boolean;
        digitsOnly?: boolean;
        maxValue?: number;
    }
    | {
        type: 'number';
        mayBeNull?: boolean;
        maxValue?: number;
    }
    | {
        type: 'statusType';
        mayBeNull?: boolean;
    }

type validationRules = Record<string, listValidationRules>;

type RequestSource = 'params' | 'body' | 'query';

export const validateReq = (source: RequestSource, rules: validationRules): RequestHandler => { 
    return (req: Request, res: Response, next: NextFunction) => {

        const data = req[source];

        if ( !data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0 ) {
            res.status(400).json({ message: 'Invalid data' })
            return;
        };

        const unkownKeys = Object.keys(data).filter(
            key => !Object.hasOwn(rules, key)
        );

        if ( unkownKeys.length > 0 ) {
            res.status(400).json({ 
                message: 'Unkown keys',
            });
            return;
        };

        for ( const [key, rule] of Object.entries(rules) ) {
            const value = data[key];

            if ( rule.mayBeNull === true && value === null ) {
                continue;
            };

            if ( value === undefined ) {
                res.status(400).json({ message: `Missing field: ${key}` })
                return;
            };

            if ( rule.type === 'string' ) {

                if ( typeof value !== 'string' ) {
                    res.status(400).json({ message: `Type of value is not a string` });
                    return;
                }

                else if ( value.length > rule.maxLength ) {
                    res.status(400).json({ message: `value is outside the permissible range ${rule.maxLength}` })
                    return;
                }

                else if ( value.length === 0 ) {
                    res.status(400).json({ message: `A value must contain characters`})
                    return;
                }

                else if ( value.includes("  ") ) {
                    res.status(400).json({ message: `A value cannot contain two or more consecutive spaces`})
                    return;
                }

                else if ( rule.digitsOnly && !/^\d+$/.test(value) ) {
                    res.status(400).json({ message: `${key} must contain only digits` });
                    return;
                }

                else if ( rule.digitsOnly && rule.maxValue !== undefined && Number(value) > rule.maxValue ) {
                    res.status(400).json({ message: `The number is outside the allowable range` });
                    return;
                };
            }

            else if ( rule.type === 'number' ) {
                
                if ( typeof value !== 'number' ) {
                    res.status(400).json({ message: `Type of value is not a number` });
                    return;
                }

                else if ( !Number.isFinite(value) ) {
                    res.status(400).json({ message: `Number infinity` });
                    return;
                }

                else if ( value <= 0 ) {
                    res.status(400).json({ message: 'Number must be positive' });
                    return;
                }

                else if (!Number.isSafeInteger(value)) {
                    res.status(400).json({ message: 'Number must be an safe integer' });
                    return;
                }

                else if ( rule.maxValue !== undefined && Number(value) > rule.maxValue ) {
                    res.status(400).json({ message: `The number is outside the allowable range` });
                    return;
                };
            }

            else if ( rule.type === 'statusType' ) {

                if ( value !== 'true' && value !== 'in progress' && value !== 'false' ) {
                    res.status(400).json({ message: 'Type of value is not a statusType' });
                    return;
                }; 
            };

        };

        next();

    };
}

export const authMiddleware =  (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if ( token === undefined ) { return res.status(401).json({ message: 'Unauthorized' }) };

    const bufA = Buffer.from(`Bearer ${process.env.API_SECRET}`, 'utf8');
    const bufB = Buffer.from(token, 'utf-8')

    if (bufA.byteLength !== bufB.byteLength || !crypto.timingSafeEqual(bufA, bufB) ) {
        return res.status(401).json({
            message: 'Unauthorized',
        });
    };

    next();
}