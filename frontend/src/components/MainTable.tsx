import React, {useState, useMemo} from 'react';
import {
    useReactTable,                  // This is THE hook that'll create the TanStack Table Instance. 
    type ColumnDef,                  // ColumnDef is just that, defining what each column will show.
    getCoreRowModel,                // see: https://tanstack.com/table/v8/docs/guide/row-models
    flexRender,                     // Renders headers and cells dynamically
    getSortedRowModel,              // Handle the dynamic sorting, filtering, etc.
    getFilteredRowModel,
    type SortingState
} from '@tanstack/react-table'
import {type User, type MutualFilm} from "../utility/types.ts";

/* This interface below is a generic TypeScript interface.
Using <T> (generic type) is good, it'll adapt to whatever type I pass in whether User or MutualFilm (reusable for both): */
// EDIT: Just going to be specific and use MutualFilm now -- the Table pretty much centers around it anyways!
interface MainTableProps {
    //data: T[];
    data: MutualFilm[]
    userData: User[]
    //columns: ColumnDef<T,any>[];
    columns: ColumnDef<MutualFilm,any>[];
}

const MainTable: React.FC<MainTableProps> = ({data, userData, columns}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    // toggles:
    const [showPosters, setShowPosters] = useState(true);
    const [minAvgRating, setMinAvgRating] = useState(0);

    const ratingMap: Record<number,string> = {
        0.5:'½',
        1:'★',
        1.5:'★½',
        2:'★★',
        2.5:'★★½',
        3:'★★★',
        3.5:'★★★½',
        4:'★★★★',
        4.5:'★★★★½',
        5:'★★★★★',
    };

    /* Constructing the "final" dynamic columns (User Ratings preceded by Film Poster, which will take up room since it'll be toggleable)
    that will be appended to right of the "base" ones (Standard Film Data: Title, Director, Average Rating etc). 
    NOTE: For the styling of all these columns, I'm going to need to rely on style={{...}} because .css won't be applied immediately on load... */
    const finalColumns = useMemo(() => {
        const userInfo = userData.map((user) => ({
            username: user.username,
            displayname: user.displayname,
            avatarLink: user.avatarLink,
        }));
        
        // Construct the poster column:
        const posterCol: ColumnDef<MutualFilm> = {
            accessorKey:"filmPoster",
            header:"Poster",
            cell:(info) => <img style={{width:"180px"}} src={info.row.original.filmPoster} alt={"Poster for " + info.row.original.title}/>
        }
        // Construct the user rating columns:
        const ratingCol: ColumnDef<MutualFilm>[] = userInfo.map(({ username, displayname, avatarLink }) => ({
            id: `rating-${username}`,
            accessorFn: (row) => row.ratings[username], // needed for sorting to work
            enableSorting: true,
            header: ({ column }) => {
                const toggleSort = column.getToggleSortingHandler(); // this will now exist
                return (
                    <div style={{display:"flex", alignItems:"center", gap:"5px"}}>
                        {/* Avatar triggers sorting */}
                        <img
                            src={avatarLink}
                            alt={`${displayname}'s avatar`}
                            style={{cursor:"pointer", height:"35px", borderRadius:"25px"}}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (toggleSort) toggleSort(e);
                            }}
                            title="Click to sort by this user's rating"
                        />

                        {/* Display name opens profile */}
                        <a
                            href={`https://letterboxd.com/${username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                            title={displayname}
                            style={{textDecoration:"none", color:"#40bcf4"}}
                            onClick={(e)=> e.stopPropagation()}
                        >
                            {displayname}
                        </a>

                        {column.getIsSorted() === 'asc' && ' ▲'}
                        {column.getIsSorted() === 'desc' && ' ▼'}
                    </div>
                );
            },
            cell: (info) => {
                const rating = info.row.original.ratings[username];
                return rating !== undefined ? rating.toFixed(1) + ` (${ratingMap[info.row.original.ratings[username]]})` : '—';
            },
        }));

        // Merge the columns for the table:
        return [
            ...(showPosters ? [posterCol] : []),
            ...columns,
            ...ratingCol,
        ];
    }, [columns,userData, showPosters]);

    // useMemo is crucial here so I don't fall into an infinite re-render loop.
    const filteredData = useMemo(() => {
        return data.filter((film) => film.avgRating >= minAvgRating)
    }, [data, minAvgRating])

    const table = useReactTable({
        data: filteredData,
        columns: finalColumns,
        state: {
            sorting,
            globalFilter,   // <-- note that this will filter down the rows taking all headers into consideration (not just film name). Guess it's desirable?
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return(
        <div id="mtWrapper">

            {/* [1] - This <div> below is for the "Central Header Area" of the (MT) Main Table. Here is:
            - The Dynamic Typeable Search Bar for filtering the table in real-time (w/ all-encompassing criteria: title, director, rating, etc).
            - Toggeable button for showing or hiding Film Posters + Slider for minimum average film rating.
            - Headers for each column under which rows will spawn for data to populate (Film Title, Release Year, Directed By, etc). */}
            <div>
                {/* Typeable Search Bar: */}    
                <input id="mtSearchBar" type="text" value={globalFilter} onChange={(e)=>setGlobalFilter(e.target.value)} placeholder="Search... (Title, Year, Director, etc)"/>
                
                {/* Toggle Poster and Minimum Average Controls: */}
                <div id="mtConfigWrapper">
                    <label>
                        <input type="checkbox" checked={showPosters} onChange={(e) => setShowPosters(e.target.checked)}/>
                        {" "}<b>Show Posters</b>
                    </label>
                    
                    <div id="mtMinAvgSlider">
                        <label>
                            <input type="range" min={0} max={5} step={0.1} value={minAvgRating} onChange={(e)=>setMinAvgRating(Number(e.target.value))} style={{marginLeft:"10px"}} />
                            {" "}<b>Minimum Average Rating</b>: {minAvgRating}{" "}
                        </label>
                    </div>
                </div>
            </div>

            {/* [2] - The actual "Main Table": */}
            <div id="mtTableScrollContainer">
                <table id="mtTable">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th title="Click to sort by ascending and descending value" 
                                        key={header.id} 
                                        onClick={header.column.getToggleSortingHandler()} 
                                        style={{position:"sticky", top:"0", zIndex:"2", backgroundColor: "#2c3440", boxShadow: "5px 5px 10px 2px rgb(0 0 0 / 0.8)", }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getIsSorted() === "asc" && " ▲"}
                                        {header.column.getIsSorted() === "desc"&& " ▼"}
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
        </div>
    );
};

export default MainTable;
