// src/routes/(app)/forms/[type]/[year]/+page.ts

import { error, redirect } from '@sveltejs/kit';

export async function load({ url, params }) {
    const { type, year } = params;

    const currentYear = new Date().getFullYear();

    // VALID RANGE OF NUMBERS IS LAST 5 YEARS
    const validYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // CONVERT `YEAR` PARAM TO NUMBER + CHECK IF VALID
    const yearNumber = parseInt(year, 10);
    if (!validYears.includes(yearNumber)) {
        throw error(404, 'Invalid year'); 
    }

    // CHECK IF URL ENDS WITH `/forms/[type]/[year]` WITHOUT FURHTER PATH
    if (url.pathname === `/forms/${type}/${year}`) {
        throw redirect(302, `/forms/${type}/${year}/overview`);
    }

    // IF YEAR IS VALID AND NO REDIRECT IS NEEDED, RETURN YEAR
    return {
        year: yearNumber,
    };
}
