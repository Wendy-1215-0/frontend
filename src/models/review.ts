import { getCookie } from '@utils/cookie';
import { errorBadRequest, errorForbidden, errorInternal, errorNotFound } from '@utils/error-msg';
import { GoodDate } from '@utils/datetime';
import axios from 'axios'
import { log } from 'console';

export enum ReviewState {
    ReviewInstructorPending,
    ReviewInstructorRejected,
    ReviewCommitteePending,
    ReviewCommitteeApproved,
    ReviewCommitteeRejected,
}

export class Review {
    id: string;
    activityId: string;
    type: number;
    owner: string;
    instructor: string;
    instructorComment: string;
    committee: string;
    committeeComment: string;
    state: ReviewState;
    updatedAt?: GoodDate;

    constructor(
        id: string,
        activityId: string,
        type: number,
        owner: string,
        instructor: string,
        instructorComment: string,
        committee: string,
        committeeComment: string,
        state: number,
        updatedAt?: GoodDate
    ) {
        this.id = id;
        this.activityId = activityId;
        this.type = type;
        this.owner = owner;
        this.instructor = instructor;
        this.instructorComment = instructorComment;
        this.committee = committee;
        this.committeeComment = committeeComment;
        this.state = state;
        this.updatedAt = updatedAt;
    }

    static fromJSON(json: any): Review {
        return new Review(
            json.id,
            json.activityId,
            json.type,
            json.owner,
            json.instructor,
            json.instructorComment,
            json.committee,
            json.committeeComment,
            json.state,
            json.updatedAt ? GoodDate.fromString(json.updatedAt) : undefined
        );
    }

    static fromJSONList(json: any): Review[] {
        return json.map((item: any) => Review.fromJSON(item));
    }

    static template(): Review {
        return new Review('', '', 0, '', '', '', '', '', 0);
    }

    static list = async (activityId: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/activity/' + activityId + '/review');
        const json = await response.json();
        if (response.ok) {
            return json;
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

    static update = async (
        activityId: string,
        reviewId: string,
        data: { state: boolean; comment: string },
        props: { serverEndpoint?: string }
    ) => {
        const response = await fetch(props.serverEndpoint + '/activity/' + activityId + '/review/' + reviewId, {
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
        } else if (response.status === 404) {
            throw new Error(errorNotFound);
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            throw new Error(json.error);
        }
    };

    static create = async (activityId: string, props: { serverEndpoint?: string }) => {
        const response = await fetch(props.serverEndpoint + '/activity/' + activityId + '/review/new', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: getCookie('token') || '',
            },
        });
        const json = await response.json();

        if (response.ok) {
            return json;
        } else if (response.status === 500) {
            throw new Error(errorInternal);
        } else {
            throw new Error(json.error);
        }
    };
    static listByReviewerId = async (
        {
            offset = 0,
            limit = 20,
            type = '-1',
            state = '-1',
        }: {
            offset?: number;
            limit?: number;
            type?: string;
            state?: string;
        },
        props: { serverEndpoint?: string }
    ) => {
        try {
            const url = new URL(`${props.serverEndpoint}/activity`);
            
            // 构建查询参数，确保符合后端要求
            url.searchParams.append('offset', offset.toString());
            url.searchParams.append('limit', limit.toString());
            
            // 仅当 state 不是 '-1' 时才添加到查询参数中
            if (state !== '-1') {
                url.searchParams.append('state', state);
            }
            
            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': getCookie('token') || '',
                }
            });
            
            if (!response.ok) {
                const json = await response.json();
                if (response.status === 404) {
                    throw new Error(errorNotFound);
                } else if (response.status === 500) {
                    throw new Error(errorInternal);
                } else {
                    throw new Error(json.message || '未知错误');
                }
            }
            
            const json = await response.json();
            
            if (!json || !json.data) {
                return [];
            }
            
            // 将活动数据转换为审核数据格式
            return json.data.map((activity: any) => {
                return new Review(
                    activity.id || '',
                    activity.name || '',
                    0,
                    activity.owner || '',
                    '待分配',
                    '',
                    '待分配',
                    '',
                    activity.state || 0,
                    activity.updatedAt ? GoodDate.fromString(activity.updatedAt) : undefined
                );
            });
        } catch (error) {
            console.error('请求错误:', error);
            if (error instanceof Error) {
                if (error.message === 'Failed to fetch') {
                    throw new Error('网络请求超时，请检查您的网络连接');
                }
                throw error;
            }
            throw new Error('未知错误');
        }
    };
}
