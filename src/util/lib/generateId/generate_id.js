import UUID from 'pure-uuid';
import btoa from 'btoa';
const generateId = () =>  {
    return btoa(new UUID(4)).substring(0, 12);
}

export { generateId };
