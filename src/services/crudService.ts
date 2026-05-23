import { supabase } from './supabaseClient';

export const crudService = {
    /**
     * CREATE: Insert a new record into a table
     */
    createRecord: async (tableName: string, data: any) => {
        const { data: result, error } = await supabase
            .from(tableName)
            .insert([data])
            .select();

        if (error) {
            console.error(`Error creating record in ${tableName}:`, error);
            throw error;
        }
        return result;
    },

    /**
     * READ: Fetch records from a table
     */
    readRecords: async (tableName: string, matchQuery?: any) => {
        let query = supabase.from(tableName).select('*');

        if (matchQuery) {
            query = query.match(matchQuery);
        }

        const { data: result, error } = await query;

        if (error) {
            console.error(`Error reading records from ${tableName}:`, error);
            throw error;
        }
        return result;
    },

    /**
     * UPDATE: Modify an existing record
     */
    updateRecord: async (tableName: string, id: string | number, data: any) => {
        const { data: result, error } = await supabase
            .from(tableName)
            .update(data)
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error updating record in ${tableName}:`, error);
            throw error;
        }
        return result;
    },

    /**
     * DELETE: Remove a record from a table
     */
    deleteRecord: async (tableName: string, id: string | number) => {
        const { data: result, error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Error deleting record from ${tableName}:`, error);
            throw error;
        }
        return result;
    }
};
