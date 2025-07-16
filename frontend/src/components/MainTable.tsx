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
import { useResolvedPath } from 'react-router-dom';

/* This interface below is a generic TypeScript interface.
Using <T> (generic type) is good, it'll adapt to whatever type I pass in whether User or MutualFilm (reusable for both): */
// EDIT: Just going to be specific and use MutualFilm now -- the Table pretty much centers around it anyways!
//interface MainTableProps<T> {
interface MainTableProps {
    //data: T[];
    data: MutualFilm[]
    userData: User[]
    //columns: ColumnDef<T,any>[];
    columns: ColumnDef<MutualFilm,any>[];
}

//const MainTable = <T,>({data, columns}: MainTableProps<T>) => {
const MainTable: React.FC<MainTableProps> = ({data, userData, columns}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    // toggles:
    const [showPosters, setShowPosters] = useState(true);
    const [minAvgRating, setMinAvgRating] = useState(0);

    /* Constructing the "final" dynamic columns (User Ratings preceded by Film Poster, which will take up room since it'll be toggleable)
    that will be appended to right of the "base" ones (Standard Film Data: Title, Director, Average Rating etc). */
    const finalColumns = useMemo(() => {
        //const usernames = userData.map(user => user.username);
        const userInfo = userData.map((user) => ({
            username: user.username,
            displayname: user.displayname,
            avatarLink: user.avatarLink,
        }));
        
        // Construct the poster column:
        const posterCol: ColumnDef<MutualFilm> = {
            accessorKey:"filmPoster",
            header:"Poster",
            cell:(info) => <img src={info.row.original.filmPoster} alt={"Poster for " + info.row.original.title}/>
        }
        // Construct the user rating columns:
        // NOTE:+TO-DO: ^ In the header area, I also want the User avatar to appear too (quite small), keep that in mind.
        const ratingCol: ColumnDef<MutualFilm>[] = userInfo.map(({username, displayname, avatarLink}) => ({
            id: `rating-${username}`,
            //header: username,
            header: () => (
                <div>
                    <a href={`https://letterboxd.com/${username}/`}>
                        {displayname}
                    </a>
                    <img src={avatarLink} alt={`${username}'s Avatar`}/>
                </div>
            ),
            cell: (info) => info.row.original.ratings[username]?.toFixed(1) ?? "—",
        }));
        // Merge the columns for the table:
        return [
            ...(showPosters ? [posterCol] : []),
            ...columns,
            ...ratingCol,
        ];
    }, [columns,userData, showPosters]);

    console.log("DEBUG: The value of minAvgRating => ", minAvgRating);

    // useMemo is crucial here so I don't fall into an infinite re-render loop.
    const filteredData = useMemo(() => {
        return data.filter((film) => film.avgRating >= minAvgRating)
    }, [data, minAvgRating])

    const table = useReactTable({
        //data,
        data: filteredData,
        columns: finalColumns,
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
