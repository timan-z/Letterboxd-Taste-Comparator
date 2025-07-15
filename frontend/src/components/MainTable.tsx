import React, {useState, useMemo} from 'react';
import {
    useReactTable,              // This is THE hook that'll create the TanStack Table Instance. 
    type ColumnDef,                  // ColumnDef is just that, defining what each column will show.
    getCoreRowModel,            // see: https://tanstack.com/table/v8/docs/guide/row-models
    flexRender,                 // Renders headers and cells dynamically
    getSortedRowModel,          // Handle the dynamic sorting, filtering, etc.
    getFilteredRowModel,
    type SortingState
} from '@tanstack/react-table'
import {type User, type MutualFilm} from "../utility/types.ts";

/* This interface below is a generic TypeScript interface.
Using <T> (generic type) is good, it'll adapt to whatever type I pass in whether User or MutualFilm (reusable for both): */
// EDIT: Just going to be specific and use MutualFilm now -- the Table pretty much centers around it anyways!
//interface MainTableProps<T> {
interface MainTableProps {
    //data: T[];
    data: MutualFilm[]
    //columns: ColumnDef<T,any>[];
    columns: ColumnDef<MutualFilm,any>[];
}

//const MainTable = <T,>({data, columns}: MainTableProps<T>) => {
const MainTable: React.FC<MainTableProps> = ({data, columns}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    // toggles:
    const [showPosters, setShowPosters] = useState(true);
    const [minAvgRating, setMinAvgRating] = useState(0);

    console.log("DEBUG: The value of minAvgRating => ", minAvgRating);

    const filteredData = useMemo(() => {
        return data.filter((film) => film.avgRating >= minAvgRating)
    }, [data, minAvgRating])
    
    /*data.filter(
        (film) => film.avgRating >= minAvgRating    
    )*/
    /*const filteredData = (data as any[]).filter((film) => {
        return typeof film.avgRating === "number" && film.avgRating >= minAvgRating;
    });*/

    const table = useReactTable({
        //data,
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter,   // <-- note that this will filter down the rows taking all headers into consideration (not just film name). Should change?
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return(
        <div>

        {/* Below will be the typeable search bar for dynamically filtering the table: */}
        <div>
            <input type="text" value={globalFilter} onChange={(e)=>setGlobalFilter(e.target.value)} placeholder="Search..." />

            {/* Controls for [1] - Toggling Posters and [2] - setting Minimum Average Rating (TO-DO: Eventually, need User Avatars too). */}
            <div>
                {/* [1] - Toggling Posters. */}
                <label>
                    <input type="checkbox" checked={showPosters} onChange={(e) => setShowPosters(e.target.checked)}/>
                    {" "}Show Posters
                </label>
                {/* [2] - Setting Minimum Average Rating. */}
                <label>
                    Min Avg Rating: {minAvgRating}
                    <input type="range" min={0} max={5} step={0.1} value={minAvgRating} onChange={(e)=>setMinAvgRating(Number(e.target.value))} />
                </label>
            </div>
        </div>

        <table>

            <thead>

                


                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th key={header.id} onClick={header.column.getToggleSortingHandler()} >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getIsSorted() === "asc" && "ASC"}
                                {header.column.getIsSorted() === "desc"&& "DESC"}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
        

        </div>
    );
};

export default MainTable;
