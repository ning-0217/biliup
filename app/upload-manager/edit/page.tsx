'use client'

import React, {useEffect, useRef, useState} from "react";
import {Button, Form, Notification, Toast, Typography} from "@douyinfe/semi-ui";
import {IconPlusCircle} from "@douyinfe/semi-icons";
import {BiliType, fetcher, LiveStreamerEntity, sendRequest, StudioEntity} from "@/app/lib/api-streamer";
import TemplateFields from "@/app/ui/TemplateFields";
import {registerMediaQuery, responsiveMap} from "@/app/lib/utils";
import useSWRMutation from "swr/mutation";
import {useRouter, useSearchParams} from "next/navigation";
import {FormApi} from "@douyinfe/semi-ui/lib/es/form";
import useSWR from "swr";
import {useTypeTree} from "@/app/lib/use-streamers";

const EditTemplate: React.FC = () => {
    const { Paragraph } = Typography;
    const searchParams = useSearchParams();
    const { trigger } = useSWRMutation('/v1/upload/streamers', sendRequest);
    const { data, error, isLoading, mutate } = useSWR<StudioEntity>(() => (searchParams.get('id') ? `/v1/upload/streamers/${searchParams.get('id')}` : null), fetcher);
    const router = useRouter();
    const { typeTree, isError } = useTypeTree();
    const api = useRef<FormApi>();
    const [labelPosition, setLabelPosition] = useState<'top' | 'left' | 'inset'>('inset');
    useEffect(()=> {
        const unRegister = registerMediaQuery(responsiveMap.lg, {
            match: () => {
                setLabelPosition('left');
            },
            unmatch: () => {
                setLabelPosition('top');
            },
        })
        return () => unRegister();
    }, []);

    if (error || isError) return <div>{error?.message}</div>;
    if (isLoading) return <div>Loading...</div>;
    if (!data || !typeTree) return null;
    let uploadStreamers = {
        ...data,
        tag: data.tags?.length === 0 ? [] : data.tags?.split(','),
        tid: [typeTree.find((tt: BiliType) => {
            return tt.children.some(ct => ct.id === data?.tid);
        }).value, data.tid]
    };
    return (<>
        <div style={{display: 'flex', flexDirection: 'row-reverse', paddingRight: 12}}>
            <Button onClick={async ()=>{
                let values = await api.current?.validate();
                try {
                    const studioEntity = {
                        template_name: values?.template_name,
                        copyright: values?.copyright,
                        id: values?.id,
                        source: values?.source ?? '',
                        tid: values?.tid[1],
                        cover: values?.cover ?? '',
                        title: values?.title ?? '',
                        description: values?.description ?? '',
                        dynamic: values?.dynamic ?? '',
                        tag: values?.tag ?? '',
                        interactive: values?.interactive ?? 0,
                        dolby: values?.dolby ?? 0,
                        lossless_music: values?.lossless_music ?? 0,
                        up_selection_reply: values?.up_selection_reply ?? false,
                        up_close_reply: values?.up_close_reply ?? false,
                        up_close_danmu: values?.up_close_danmu ?? false,
                        open_elec: values?.open_elec,
                        no_reprint: values?.no_reprint,
                        mission_id: values?.mission_id,
                        dtime: values?.dtime,
                        user_cookie: values?.user_cookie,
                    }
                    const result = await trigger(studioEntity);
                    await mutate(result);
                    Toast.success('更新成功');
                    router.push('/upload-manager');
                }catch (e: any) {
                    // error handling
                    Notification.error({
                        title: '创建失败',
                        content: <Paragraph style={{maxWidth: 450}}>{e.message}</Paragraph>,
                        // theme: 'light',
                        // duration: 0,
                        style: {width: 'min-content'}
                    });
                }

            }} type='primary' icon={<IconPlusCircle size='large'/>} theme='solid' style={{ marginTop: 12, marginRight: 4 }}>保存模板</Button>
        </div>
            <Form initValues={uploadStreamers} style={{paddingLeft: 30, paddingBottom: 40}} getFormApi={formApi => api.current = formApi} autoScrollToError component={TemplateFields} labelWidth='180px' labelPosition={labelPosition}/>
        </>);
}

export default EditTemplate;
