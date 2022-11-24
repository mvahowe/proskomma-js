import UUID from 'pure-uuid';
import btoa from 'btoa';
const generateId = () => btoa(new UUID(4)).substring(0, 12);

export { generateId };
