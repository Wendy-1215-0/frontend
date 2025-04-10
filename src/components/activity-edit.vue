<script lang="ts" setup>
import { inject, ref } from 'vue';
import Spinner from '@components/spinner.vue';
import { GoodDate } from '@utils/datetime';
import { Activity } from '@models/activity';
import InputTextarea from '@components/input-textarea.vue';
import InputText from '@components/input-text.vue';
import InputDate from '@components/input-date.vue';
// import ActivityPreview from '@components/activity-preview.vue';

const { setMessage } = inject('banner') as any;

interface Model {
    id: string;
    name: string;
    date: string;
    description: string;
    location: string;
}

const {
        id,
        onSaved,
        editable = true,
    } = defineProps<{
        id: string;
        onSaved: (activity: Model) => void;
        editable?: boolean;
    }>(),
    isCreatingNewActivity = id.startsWith('new_'),
    activity = ref<Model>({
        id: id.substring(4),
        name: '',
        date: new GoodDate().toInputDateString(),
        description: '',
        location: '',
    }),
    status = ref(isCreatingNewActivity ? 1 : 0),
    submittable = ref(true);

const getActivity = async () => {
        status.value = 0;
        try {
            const data = await Activity.get(id, {
                serverEndpoint: 'http://127.0.0.1/api',
            });
            activity.value = {
                id: id,
                name: data.name,
                date: data.date.toInputDateString(),
                description: data.description,
                location: data.location,
            };
            setMessage({
                type: 'success',
                message: '获取活动信息成功',
            });
            status.value = 1;
        } catch (e) {
            console.error(e);
            setMessage({
                type: 'error',
                message: '获取活动信息失败，请稍后重试',
            });
            status.value = 2;
        }
    },
    onSubmit = async () => {
        submittable.value = false;
        try {
            if (isCreatingNewActivity) {
                await Activity.create(activity.value, {
                    serverEndpoint: 'http://127.0.0.1/api',
                });
            } else {
                await Activity.update(id, activity.value, {
                    serverEndpoint: 'http://127.0.0.1/api',
                });
            }
            onSaved(activity.value);
        } catch (e: any) {
            setMessage({
                type: 'error',
                message: e.message,
            });
            submittable.value = true;
        }
    };

if (!isCreatingNewActivity) {
    getActivity();
}
</script>

<template>
    <Spinner v-if="status === 0" />
    <div v-if="status !== 2" class="lg:flex lg:w-full lg:items-start lg:space-x-8">
        <template v-if="editable">
            <form class="w-md space-y-2" @submit.prevent="onSubmit">
                <input-text v-model="activity.name" label="名称" name="name" placeholder="请输入名称……" type="text" />
                <input-textarea v-model="activity.location" label="地点" name="location" placeholder="请输入地点……" />
                <input-date v-model="activity.date" label="时间" name="date" placeholder="请输入时间……" type="date" />
                <input-textarea
                    v-model="activity.description"
                    label="简介"
                    name="description"
                    placeholder="请输入简介……"
                />

                <button
                    :disabled="status === 0"
                    class="bg-primary hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 mt-8 flex w-full cursor-pointer items-center justify-center rounded-md px-4 py-2 font-medium text-white transition duration-200"
                    type="submit"
                >
                    <Spinner v-if="status === 0" size="md" />
                    <span v-else>保存</span>
                </button>
            </form>
        </template>
        <!-- <div class="w-md rounded-lg border p-4">
            <h3 class="mb-4 text-2xl font-black" v-if="editable">预览活动信息</h3>
            <activity-preview :model="activity" />
        </div> -->
    </div>
    <p v-if="status === 2">
        无法获取活动信息；
        <a class="text-primary dark:text-primary-200 underline" href="?" @click.prevent="getActivity">重试</a>
    </p>
</template>
