// Source - https://stackoverflow.com/a/79560198
// Posted by Adri w Ukraine, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-10, License - CC BY-SA 4.0

/** /utils/convertToObject.js. **/
export function convertToSerializableObject(leanDocument: any){
    for (const key of Object.keys(leanDocument)){
        if (leanDocument[key].toJSON && leanDocument[key].toString){
            leanDocument[key] = leanDocument[key].toString();
        }
    }
    return leanDocument;
}
