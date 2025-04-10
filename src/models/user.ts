import { getCookie } from '@utils/cookie';
import { GoodDate } from '@utils/datetime';
import { errorBadRequest, errorForbidden, errorNotFound } from '@utils/error-msg';
import { Ticket } from '@models/ticket';

export enum UserType {
    UserSU,
    UserInstructor,
    UserLocalOrg,
    UserLocalCommittee,
    UserOrg,
    UserCommittee,
    UserStudent,
}

const UserTypeString = ['超级管理员', '指导老师', '院管组织', '院团委', '校级组织', '校团委', '学生'];

export const getUserTypeString = (type: any) => {
    if (typeof type === 'string') {
        return UserTypeString[parseInt(type)];
    } else if (typeof type === 'number') {
        return UserTypeString[type];
    }
};

export class User {
    id: string;
    name: string;
    type: UserType;

    constructor(id: string, name: string, type: UserType) {
        this.id = id;
        this.name = name;
        this.type = type;
    }

    typeString() {
        return UserTypeString[this.type];
    }

    static signOut = async (props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/user/sign-out', {
            method: 'POST',
            headers: {
                Authorization: getCookie('token') || '',
            },
        });
        if (response.ok) {
            return true;
        } else {
            const json = await response.json();
            throw new Error(json.error);
        }
    };

    static signInOAuth2 = async (_: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/user/oauth2/sign-in?code=2023212276', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const json = await response.json();

        if (response.ok) {
            return json.data;
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else {
            throw new Error(json.message);
        }
    };
}

export class Admin extends User {
    description: string;
    instructor?: string;
    committee?: string;
    password: string;
    createdAt: GoodDate;
    deletedAt: GoodDate | undefined;

    constructor(
        id: string,
        name: string,
        type: UserType,
        description: string,
        instructor: string | undefined,
        committee: string | undefined,
        password: string,
        createdAt: string | GoodDate,
        deletedAt?: string | GoodDate
    ) {
        super(id, name, type);
        this.description = description;
        this.instructor = instructor;
        this.committee = committee;
        this.password = password;
        this.createdAt = typeof createdAt === 'string' ? GoodDate.fromString(createdAt) : createdAt;
        this.deletedAt = deletedAt
            ? typeof deletedAt === 'string'
                ? GoodDate.fromString(deletedAt)
                : deletedAt
            : undefined;
    }

    static fromJSON(json: any): Admin {
        return new Admin(
            json.id,
            json.name,
            json.type,
            json.description,
            json.instructor,
            json.committee,
            json.password,
            json.createdAt,
            json.updatedAt
        );
    }

    static fromJSONList(json: any): Admin[] {
        return json.map((item: any) => Admin.fromJSON(item));
    }

    static template = new Admin('', '', UserType.UserSU, '', '', '', '', new GoodDate(), undefined);

    static listAdmin = async (props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/user/admin');
        const json = await response.json();
        if (response.ok) {
            return Admin.fromJSONList(json.data);
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else {
            throw new Error(json['error']);
        }
    };

    static getAdmin = async (id: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/user/admin/' + id);
        const json = await response.json();
        if (response.ok) {
            return Admin.fromJSON(json.data);
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else {
            throw new Error(json['error']);
        }
    };

    static createAdmin = async (
        data: {
            id: string;
            name: string;
            type: UserType;
            password: string;
            instructor?: string;
            committee?: string;
        },
        props: { serverEndpoint?: string }
    ) => {
        const response = await fetch(props.serverEndpoint + '/user/admin/new', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getCookie('token') || '',
            },
            body: JSON.stringify(data),
        });

        const json = await response.json();

        if (response.ok) {
            return Admin.fromJSON(json.data);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else {
            throw new Error(json.error);
        }
    };

    static updateAdmin = async (
        id: string,
        data: {
            name: string;
            description: string;
            password: string;
            type?: UserType;
            instructor?: string;
            committee?: string;
        },
        props: { serverEndpoint?: string }
    ) => {
        const response = await fetch(props.serverEndpoint + '/user/admin/update/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getCookie('token') || '',
            },
            body: JSON.stringify(data),
        });
        const json = await response.json();
        console.log(json,123123)
        if (response.ok) {
            return Admin.fromJSON(json.data);
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else {
            throw new Error(json.error);
        }
    };

    static deleteAdmin = async (id: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/user/admin' + id, {
            method: 'DELETE',
            headers: {
                Authorization: getCookie('token') || '',
            },
        });
        if (response.ok) {
            return true;
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else {
            const json = await response.json();
            throw new Error(json.error);
        }
    };

    static async signInAdmin(credentials: { name: string; password: string }, props: { serverEndpoint?: string } = {}) {
        const response = await fetch(`${props.serverEndpoint}/user/admin/sign-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            }),
            json = await response.json();

        if (!response.ok) {
            throw new Error(json.message || '登录失败');
        }

        return json.data;
    }
}

export class Student extends User {
    class: string;

    constructor(id: string, name: string, type: UserType, class_: string) {
        super(id, name, type);
        this.class = class_;
    }

    static fromJSON(json: any): Student {
        return new Student(json.id, json.name, json.type, json.class);
    }

    static fromJSONList(json: any): Student[] {
        return json.map((item: any) => Student.fromJSON(item));
    }

    static template = new Student('', '', UserType.UserStudent, '');

    static importStudents = async (
        data: {
            students: {
                id: string;
                name: string;
                class: string;
            }[];
            classes: {
                name: string;
                school: string;
            }[];
            schools: {
                name: string;
            }[];
        },
        props: { serverEndpoint: string }
    ) => {
        const response = await fetch(`${props.serverEndpoint}/user/student/import`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getCookie('token') || '',
            },
            body: JSON.stringify(data),
        });

        const json = await response.json();
        if (response.ok) {
            return json;
        } else if (response.status === 400) {
            throw new Error(errorBadRequest);
        } else if (response.status === 403) {
            throw new Error(errorForbidden);
        } else {
            throw new Error(json.error);
        }
    };

    static getStudentTickets = async (props: { serverEndpoint: string }) => {
        const response = await fetch(`${props.serverEndpoint}/user/student/tickets`, {
                headers: {
                    Authorization: getCookie('token') || '',
                },
            }),
            json = await response.json();
        if (response.ok) {
            return Ticket.fromJSONList(json);
        }
    };
}

export class Class {
    id: string;
    name: string;
    school: string;

    constructor(id: string, name: string, school: string) {
        this.id = id;
        this.name = name;
        this.school = school;
    }

    static fromJSON(json: any): Class {
        return new Class(json.id, json.name, json.school);
    }

    static fromJSONList(json: any): Class[] {
        return json.map((item: any) => Class.fromJSON(item));
    }

    static template = new Class('', '', '');
}

export class School {
    id: string;
    name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    static fromJSON(json: any): School {
        return new School(json.id, json.name);
    }

    static fromJSONList(json: any): School[] {
        return json.map((item: any) => School.fromJSON(item));
    }

    static template = new School('', '');
}
