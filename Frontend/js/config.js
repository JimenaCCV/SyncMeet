const API = 'https://syncmeet-production.up.railway.app/api';

let currentUser   = null;
let currentMeetingId    = null;
let currentMeetingTitle = '';
let selectedOpcionId    = null;
let pendingSlots  = [];
let allMeetings   = [];
let currentFilter = 'all';
let dashPage      = 1;
const ITEMS_PER_PAGE = 8;
