/**
 * @file pricing.js
 * @description Helpers for calculating plan pricing discounts and formatting.
 */

/**
 * Calculate the annual discount percentage when paying annually compared to 4 quarters.
 * @param {number|string} quarterlyPrice - Price per quarter
 * @param {number|string} yearlyPrice - Price per year
 * @returns {number} Discount percentage (e.g., 17, 44, or 0)
 */
export const calculateAnnualDiscountPercent = (quarterlyPrice, yearlyPrice) => {
  const q = Number(quarterlyPrice);
  const y = Number(yearlyPrice);
  if (!q || !y || q <= 0 || y <= 0) return 0;
  const annualAtQuarterlyRate = q * 4;
  if (annualAtQuarterlyRate <= y) return 0;
  return Math.round(((annualAtQuarterlyRate - y) / annualAtQuarterlyRate) * 100);
};

/**
 * Format the annual discount text.
 * @param {number|string} quarterlyPrice
 * @param {number|string} yearlyPrice
 * @param {string} prefix - e.g. "Save " or "(Save "
 * @param {string} suffix - e.g. " on Annual Billing" or "%)"
 * @returns {string}
 */
export const formatAnnualDiscountLabel = (quarterlyPrice, yearlyPrice, prefix = 'Save ', suffix = ' on Annual Billing') => {
  const discount = calculateAnnualDiscountPercent(quarterlyPrice, yearlyPrice);
  if (discount <= 0) return '';
  return `${prefix}${discount}%${suffix}`;
};
