import { getCookie } from '@utils/cookie';
import { GoodDate } from '@utils/datetime';
import { errorBadRequest, errorForbidden, errorInternal, errorNotFound } from '@utils/error-msg';


export enum ActivityState {
    Draft = 0,
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    TicketPending = 4,
    TicketApproved = 5,
    TicketRejected = 6,
}

export const getActivityStateString = (state: ActivityState): string => {
    switch (state) {
        case ActivityState.Draft:
            return '活动草稿';
        case ActivityState.Pending:
            return '活动待审核';
        case ActivityState.Approved:
            return '活动审核通过';
        case ActivityState.Rejected:
            return '活动审核不通过';
        case ActivityState.TicketPending:
            return '活动加分条待审核';
        case ActivityState.TicketApproved:
            return '活动加分条审核通过';
        case ActivityState.TicketRejected:
            return '活动加分条审核不通过';
        default:
            return '';
    }
};

export class Activity {
    id: string;
    name: string;
    description: string;
    location: string;
    date: GoodDate;
    state: ActivityState;
    owner: string;
    instructor: string;
    committee: string;
    createdAt: GoodDate;
    updatedAt: GoodDate;
    deletedAt: GoodDate | undefined;

    constructor(
        id: string,
        name: string,
        description: string,
        location: string,
        date: string | GoodDate,
        state: ActivityState,
        owner: string,
        instructor: string,
        committee: string,
        createdAt: string | GoodDate,
        updatedAt: string | GoodDate,
        deletedAt?: string | GoodDate
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.location = location;
        this.date = typeof date === 'string' ? GoodDate.fromString(date) : date;
        this.state = state;
        this.owner = owner;
        this.instructor = instructor;
        this.committee = committee;
        this.createdAt = typeof createdAt === 'string' ? GoodDate.fromString(createdAt) : createdAt;
        this.updatedAt = typeof updatedAt === 'string' ? GoodDate.fromString(updatedAt) : updatedAt;
        this.deletedAt = deletedAt
            ? typeof deletedAt === 'string'
                ? GoodDate.fromString(deletedAt)
                : deletedAt
            : undefined;
    }

    static fromJSON(json: any): Activity {
        return new Activity(
            json.id,
            json.name,
            json.description,
            json.location,
            json.date,
            json.state,
            json.owner,
            json.instructor,
            json.committee,
            json.createdAt,
            json.updatedAt,
            json.deletedAt
        );
    }

    static fromJSONList(json: any): Activity[] {
        return json.map((item: any) => Activity.fromJSON(item));
    }

    static template = new Activity(
        '',
        '',
        '',
        '',
        new GoodDate(),
        ActivityState.Draft,
        '',
        '',
        '',
        new GoodDate(),
        new GoodDate(),
        undefined
    );

    static list = async (limit: number, offset: number, state: number, props: { serverEndpoint?: string }) => {
        const url = `${props.serverEndpoint}/activity`
        console.log('====================================');
        console.log(url);
        console.log('====================================');
        const response = await fetch(
            url
        );
        const json = await response.json();
        if (response.ok) {
            return Activity.fromJSONList(json.data);
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            throw new Error(json['error']);
        }
    };

    static get = async (id: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/activity/' + id);
        const json = await response.json();
        if (response.ok) {
            return Activity.fromJSON(json.data);
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            throw new Error(json.error);
        }
    };

    static create = async (
        data: {
            id: string;
            name: string;
            description: string;
            location: string;
            date: string;
        },
        props: { serverEndpoint?: string }
    ) => {
        const response = await fetch(props.serverEndpoint + '/activity/new', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getCookie('token') || '',
            },
            body: JSON.stringify(data),
        });

        const json = await response.json();

        if (response.ok) {
            return Activity.fromJSON(json.data);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            throw new Error(json.error);
        }
    };

    static update = async (
        id: string,
        data: {
            name: string;
            description: string;
            location: string;
            date: string;
        },
        props: { serverEndpoint?: string }
    ) => {
        const response = await fetch(props.serverEndpoint + '/activity/update/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getCookie('token') || '',
            },
            body: JSON.stringify(data),
        });
        const json = await response.json();

        if (response.ok) {
            return Activity.fromJSON(json.data);
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            throw new Error(json.error);
        }
    };

    static delete = async (id: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/activity/' + id, {
            method: 'DELETE',
            headers: {
                Authorization: getCookie('token') || '',
            },
        });
        if (response.ok) {
            return true;
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            const json = await response.json();
            throw new Error(json.error);
        }
    };
}
