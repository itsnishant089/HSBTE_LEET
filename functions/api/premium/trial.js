/**
 * Free trial sign-up — DISABLED. Free trial has been removed from Premium.
 * All signups now go through the paid flow at /api/pay/start.
 */
import { fail } from '../../_lib/book-core.js';

export async function onRequestPost() {
  return fail('Free trial is no longer available. Please purchase Premium access at hsbteleet.com/btech-leet-premium', 410, 'trial_removed');
}
