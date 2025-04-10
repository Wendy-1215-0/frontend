<script lang="ts" setup>
import { setTitle } from '@utils/title';
import { Activity, ActivityState } from '@models/activity';
import { inject, ref, nextTick } from 'vue'; // 引入 nextTick
import Spinner from '@components/spinner.vue';
import ActivityRow from '@components/activity-row.vue';
import { GoodDate } from '@utils/datetime';
import ActivityDetailTab from '@pages/activity-detail-tab.vue';
import ActivityTab from '@pages/activity-tab.vue';
import ActivityfixTab from '@pages/activityfix-tab.vue';
import InputSelect from '@components/input-select.vue';
import { errorBadRequest, errorForbidden, errorNotFound, errorInternal } from '@/utils/error-msg';

const { setMessage } = inject('banner') as any;

setTitle('活动管理');

interface Model {
    id: string;
    name: string;
    date: GoodDate;
    state: ActivityState;
    actions: string[];
}

let activities = ref<Model[]>([]),
    status = ref(0),
    state = ref('-1'),
    limit = 50,
    offset = ref(0),
    activeID = ref<string>(),
    currentAction = ref<string>();
    
// 确认删除对话框
const showDeleteConfirm = ref(false);
const activityToDelete = ref<string>('');
const deleteLoading = ref(false);

const handleQuery = async (_: boolean = false) => {
        status.value = 0;
        activeID.value = '';
        currentAction.value = '';

        try {
            const t = await Activity.list(limit, offset.value, parseInt(state.value), {
                serverEndpoint: 'http://127.0.0.1/api',
            });
            console.log(t)
            activities.value = t.map((activity) => {
                return {
                    id: activity.id,
                    name: activity.name,
                    date: activity.date,
                    state: activity.state,
                    actions: ['活动事项', '活动详情','活动修改', '删除'], // 添加删除操作
                };
            });
            setMessage({
                type: 'success',
                message: '成功获取活动信息',
            });
            status.value = 1;
        } catch (e) {
            setMessage({
                type: 'error',
                message: '无法获取活动信息',
            });
            console.log(e);
            status.value = 2;
        }
    },
    onActivitySaved = async (newActivity: { name: string; date: string }) => {
        setMessage({
            type: 'success',
            message: '活动信息已保存',
        });
        activities.value = activities.value.map((activity) => {
            if (activity.id === activeID.value) {
                return {
                    ...activity,
                    name: newActivity.name,
                    date: GoodDate.fromString(newActivity.date),
                };
            }
            return activity;
        });
    };

// 处理活动操作
const handleActivityAction = (activity: Model, action: string) => {
    if (action === '删除') {
        // 显示确认删除对话框
        activityToDelete.value = activity.id;
        showDeleteConfirm.value = true;
    } else {
        if (activeID.value === activity.id && currentAction.value === action) {
            activeID.value = '';
            currentAction.value = '';
            nextTick(() => {
                activeID.value = activity.id;
                currentAction.value = action;
            });
        } else {
            activeID.value = activity.id;
            currentAction.value = action;
        }
    }
};

// 删除活动
const deleteActivity = async () => {
    if (!activityToDelete.value) return;
    
    deleteLoading.value = true;
    try {
        await Activity.delete(activityToDelete.value, {
            serverEndpoint: 'http://127.0.0.1/api',
        });
        
        // 从活动列表中移除被删除的活动
        activities.value = activities.value.filter(activity => activity.id !== activityToDelete.value);
        
        // 如果当前选中的是被删除的活动，清除选中状态
        if (activeID.value === activityToDelete.value) {
            activeID.value = '';
            currentAction.value = '';
        }
        
        setMessage({
            type: 'success',
            message: '活动已成功删除',
        });
        
        closeDeleteConfirm();
    } catch (error) {
        let errorMessage = '删除活动失败，请稍后重试';
        
        if (error instanceof Error) {
            if (error.message === errorBadRequest) {
                errorMessage = '请求参数错误';
            } else if (error.message === errorForbidden) {
                errorMessage = '您没有权限删除此活动';
            } else if (error.message === errorNotFound) {
                errorMessage = '活动不存在或已被删除';
            } else if (error.message === errorInternal) {
                errorMessage = '服务器内部错误，请联系管理员';
            } else {
                errorMessage = error.message || errorMessage;
            }
        }
        
        setMessage({
            type: 'error',
            message: errorMessage,
        });
    } finally {
        deleteLoading.value = false;
    }
};

// 关闭确认删除对话框
const closeDeleteConfirm = () => {
    showDeleteConfirm.value = false;
    activityToDelete.value = '';
    deleteLoading.value = false;
};

// 初始化查询
handleQuery();
</script>

<template>
    <h2 class="mb-4 text-2xl font-black">活动管理</h2>
    <form class="mb-8 flex items-center" @submit.prevent="handleQuery(false)">
        <div class="flex flex-1 space-x-2">
            <InputSelect
                v-model="state"
                :options="[
                    { value: '-1', label: '全部' },
                    { value: '0', label: '活动草稿' },
                    { value: '1', label: '活动审核中' },
                    { value: '2', label: '活动审核通过' },
                    { value: '3', label: '活动审核未通过' },
                    { value: '4', label: '加分条审核中' },
                    { value: '5', label: '加分条审核通过' },
                    { value: '6', label: '加分条审核未通过' },
                ]"
                label="状态"
                name="status"
            />
        </div>
        <button
            class="focus:ring-opacity-50 bg-primary hover:bg-primary-700 dark:hover:bg-primary-500 ml-4 h-12 cursor-pointer rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            type="submit"
        >
            查询
        </button>
    </form>

    <Spinner v-if="status === 0" />
    <div v-if="status !== 2" class="relative overflow-x-auto shadow-lg sm:rounded-lg">
        <table class="w-full text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400">
            <caption
                class="bg-white p-5 text-left text-lg font-semibold text-gray-900 rtl:text-right dark:bg-gray-800 dark:text-white"
            >
                活动列表
                <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                    选择活动进而对活动执行操作，或者
                    <a
                        class="text-primary dark:text-primary-200 underline"
                        href="?"
                        @click.prevent="handleQuery(false)"
                    >
                        重新加载（这会丢失未提交的数据）
                    </a>
                </p>
            </caption>
            <thead class="bg-gray-100 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th class="px-6 py-3" scope="col">ID</th>
                    <th class="px-6 py-3" scope="col">名称</th>
                    <th class="px-6 py-3" scope="col">时间</th>
                    <th class="px-6 py-3" scope="col">状态</th>
                    <th class="px-6 py-3" scope="col">操作</th>
                </tr>
            </thead>
            <tbody>
                <ActivityRow
                    v-for="activity in activities"
                    :key="activity.id"
                    :activity="activity"
                    :on-action="(action: string) => handleActivityAction(activity, action)"
                />
            </tbody>
        </table>
        <p v-if="activities.length === 0" class="my-4 block text-center font-bold">无活动</p>
    </div>
    
    <div v-if="activeID" class="mt-8">
        <activity-detail-tab
            v-if="currentAction === '活动事项'"
            :id="activeID"
            :editable="[0, 3].indexOf(activities.find((a) => a.id === activeID)?.state ?? -1) != -1"
        />
        <activity-tab
            v-if="currentAction === '活动详情'"
            :id="activeID"
            :editable="[0, 3].indexOf(activities.find((a) => a.id === activeID)?.state ?? -1) != -1"
            :on-saved="onActivitySaved"
        />
        <activityfix-tab
            v-if="currentAction === '活动修改'"
            :id="activeID"
            :editable="[0, 3].indexOf(activities.find((a) => a.id === activeID)?.state ?? -1) != -1"
            :on-saved="onActivitySaved"
        />
    </div>
    
    <p v-if="status === 2">
        无法获取活动信息；
        <a
            class="text-primary dark:text-primary-200 underline"
            href="?"
            @click.prevent="handleQuery(false)"
            >重试</a
        >
    </p>
    
    <!-- 确认删除对话框 -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-bold mb-4">确认删除</h3>
            <p class="mb-6">您确定要删除此活动吗？此操作无法撤销。</p>
            <div class="flex justify-end space-x-3">
                <button
                    class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    @click="closeDeleteConfirm"
                    :disabled="deleteLoading"
                >
                    取消
                </button>
                <button
                    class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    @click="deleteActivity"
                    :disabled="deleteLoading"
                >
                    <Spinner v-if="deleteLoading" size="sm" class="mr-1" />
                    <span>确认删除</span>
                </button>
            </div>
        </div>
    </div>
</template>