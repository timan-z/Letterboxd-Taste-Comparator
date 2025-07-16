export type User = {
        username: string;
        displayname: string;
        avatarLink: string;
}

export type MutualFilm = {
        title: string;
        filmUrl: string;
        filmYear: string;
        filmDir: string;
        filmPoster: string;
        ratings: Record<string, number>;
        avgRating: number;
        variance: number;
}

export type HeatMapRow = {
        id: string;
        data: {
                x:string;
                y:number | null;
        }[];
}
